import 'dart:math' as math;
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _days = 30;
  late Future<DashboardStats> _future = _load();

  Future<DashboardStats> _load() async {
    final api = context.read<AuthState>().api;
    return DashboardStats.fromJson(await api.get('/dashboard/stats', query: {'days': _days}));
  }

  Future<void> _reload() async {
    setState(() => _future = _load());
    await _future.catchError((_) => DashboardStats.fromJson({'totals': {}}));
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<DashboardStats>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator(color: AppColors.primary));
        if (snap.hasError) return ErrorView(snap.error.toString(), onRetry: _reload);
        final s = snap.data!;
        return RefreshIndicator(
          onRefresh: _reload,
          color: AppColors.primary,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              Text('Overview of your doctors and patients', style: TextStyle(color: AppColors.muted.withValues(alpha: 0.9))),
              const SizedBox(height: 12),
              Wrap(spacing: 8, children: [
                for (final d in const [7, 30, 90])
                  ChoiceChip(
                    label: Text('Last $d days'),
                    selected: _days == d,
                    showCheckmark: false,
                    onSelected: (_) {
                      _days = d;
                      _reload();
                    },
                  ),
              ]),
              const SizedBox(height: 14),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.55,
                children: [
                  _Stat(Icons.medical_services_rounded, 'Total doctors', '${s.totalDoctors}', '+${s.newDoctors} in period'),
                  _Stat(Icons.groups_rounded, 'Total patients', '${s.totalPatients}', '+${s.newPatients} in period'),
                  _Stat(Icons.balance_rounded, 'Avg patients / doctor', s.avgPerDoctor.toStringAsFixed(1), null),
                  _Stat(Icons.trending_up_rounded, 'New patients (${_days}d)', '${s.newPatients}', null),
                ],
              ),
              const SizedBox(height: 16),
              _Panel('Growth over time', 'New patients and doctors per day', _Growth(s.timeline)),
              const SizedBox(height: 16),
              _Panel('Top conditions', 'Most common patient conditions', _Donut(s.conditions)),
              const SizedBox(height: 16),
              _Panel('Patients per doctor', 'Top 10 doctors by patient count', _Loads(s.perDoctor)),
              const SizedBox(height: 16),
              _Panel(
                'Recently added patients',
                'Latest registrations',
                Column(children: [
                  for (final p in s.recent)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: InitialsAvatar(p.name, size: 40),
                      title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text('${p.condition} · ${p.doctorName}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                      trailing: Text(p.createdAt == null ? '' : DateFormat('d MMM').format(p.createdAt!), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                    ),
                ]),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.icon, this.label, this.value, this.delta);
  final IconData icon;
  final String label, value;
  final String? delta;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 18, color: AppColors.primary),
              ),
              const SizedBox(width: 8),
              Expanded(child: Text(label, maxLines: 2, style: const TextStyle(color: AppColors.muted, fontSize: 12))),
            ]),
            Text(value, style: head(30)),
            if (delta != null) Text(delta!, style: const TextStyle(color: Color(0xFFBEF264), fontSize: 12, fontWeight: FontWeight.w600)),
          ]),
        ),
      );
}

class _Panel extends StatelessWidget {
  const _Panel(this.title, this.subtitle, this.child);
  final String title, subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: head(17)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            const SizedBox(height: 16),
            child,
          ]),
        ),
      );
}

class _Growth extends StatelessWidget {
  const _Growth(this.points);
  final List<TimelinePoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) return const SizedBox(height: 120, child: EmptyView(icon: Icons.show_chart_rounded, title: 'No data yet'));
    List<FlSpot> spots(int Function(TimelinePoint) pick) => [for (var i = 0; i < points.length; i++) FlSpot(i.toDouble(), pick(points[i]).toDouble())];
    final peak = math.max(4, points.map((p) => math.max(p.patients, p.doctors)).reduce(math.max));
    // round the axis up to a multiple of 4 so every grid label is a whole number
    final maxY = ((peak / 4).ceil() * 4).toDouble();
    final step = math.max(1, (points.length / 4).ceil()).toDouble();

    LineChartBarData line(List<FlSpot> s, Color c, {bool fill = false}) => LineChartBarData(
          spots: s,
          isCurved: true,
          preventCurveOverShooting: true,
          color: c,
          barWidth: 2.5,
          dotData: const FlDotData(show: false),
          belowBarData: BarAreaData(show: fill, color: c.withValues(alpha: 0.14)),
        );

    return Column(children: [
      SizedBox(
        height: 220,
        child: LineChart(LineChartData(
          minY: 0,
          maxY: maxY,
          gridData: const FlGridData(show: true, drawVerticalLine: false),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, interval: maxY / 4)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: step,
                reservedSize: 26,
                getTitlesWidget: (v, meta) {
                  final i = v.toInt();
                  if (i < 0 || i >= points.length) return const SizedBox.shrink();
                  return SideTitleWidget(meta: meta, child: Text(DateFormat('d MMM').format(points[i].date), style: const TextStyle(color: AppColors.muted, fontSize: 10)));
                },
              ),
            ),
          ),
          lineBarsData: [
            line(spots((p) => p.patients), AppColors.primary, fill: true),
            line(spots((p) => p.doctors), AppColors.indigo),
          ],
        )),
      ),
      const SizedBox(height: 10),
      const Row(children: [
        _Dot(AppColors.primary, 'New patients'),
        SizedBox(width: 16),
        _Dot(AppColors.indigo, 'New doctors'),
      ]),
    ]);
  }
}

class _Dot extends StatelessWidget {
  const _Dot(this.color, this.label);
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) => Row(children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
      ]);
}

class _Donut extends StatelessWidget {
  const _Donut(this.items);
  final List<NameValue> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox(height: 120, child: EmptyView(icon: Icons.pie_chart_rounded, title: 'No data yet'));
    return Column(children: [
      SizedBox(
        height: 190,
        child: PieChart(PieChartData(
          centerSpaceRadius: 52,
          sectionsSpace: 3,
          sections: [
            for (var i = 0; i < items.length; i++)
              PieChartSectionData(value: items[i].value.toDouble(), color: AppColors.chart[i % AppColors.chart.length], radius: 34, showTitle: false),
          ],
        )),
      ),
      const SizedBox(height: 12),
      Wrap(spacing: 14, runSpacing: 6, children: [
        for (var i = 0; i < items.length; i++) _Dot(AppColors.chart[i % AppColors.chart.length], '${items[i].name} (${items[i].value})'),
      ]),
    ]);
  }
}

class _Loads extends StatelessWidget {
  const _Loads(this.items);
  final List<NameValue> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox(height: 100, child: EmptyView(icon: Icons.bar_chart_rounded, title: 'No data yet'));
    final max = items.map((e) => e.value).reduce(math.max).toDouble();
    return Column(children: [
      for (final e in items)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Expanded(child: Text(e.name, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
              Text('${e.value}', style: const TextStyle(fontWeight: FontWeight.w700)),
            ]),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(value: max == 0 ? 0 : e.value / max, minHeight: 8, color: AppColors.primary, backgroundColor: AppColors.raise),
            ),
          ]),
        ),
    ]);
  }
}
