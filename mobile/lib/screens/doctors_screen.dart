import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../models.dart';
import '../state/auth_state.dart';
import '../state/paged_list.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/filter_sheet.dart';
import '../widgets/forms.dart';
import 'doctor_detail_screen.dart';

class DoctorsScreen extends StatefulWidget {
  const DoctorsScreen({super.key});

  @override
  State<DoctorsScreen> createState() => _DoctorsScreenState();
}

class _DoctorsScreenState extends State<DoctorsScreen> {
  late final ApiClient api = context.read<AuthState>().api;
  late final PagedList<Doctor> list = PagedList<Doctor>((page, limit, f) async {
    final res = await api.get('/doctors', query: {...f, 'page': page, 'limit': limit});
    return Paged.fromJson(res, Doctor.fromJson);
  });

  @override
  void dispose() {
    list.dispose();
    super.dispose();
  }

  Future<void> _filters() async {
    List<(String, String)> opts(dynamic l) => [for (final e in (l as List? ?? [])) (e.toString(), e.toString())];
    Map<String, dynamic> f = {};
    try {
      f = await api.get('/doctors/filters');
    } on ApiException catch (e) {
      if (mounted) toast(context, e.message);
    }
    if (!mounted) return;
    final res = await showFilterSheet(
      context,
      title: 'Filter doctors',
      initial: list.filters,
      specs: [
        FilterSpec.dropdown('specialization', 'Specialization', opts(f['specializations'])),
        FilterSpec.dropdown('hospital', 'Hospital', opts(f['hospitals'])),
        const FilterSpec.date('from', 'Added from'),
        const FilterSpec.date('to', 'Added to'),
        const FilterSpec.dropdown('sort', 'Sort by', [('oldest', 'Oldest first'), ('name', 'Name A to Z')], allLabel: 'Newest first'),
      ],
    );
    if (res != null) list.setFilters({...res, if (list.filters['q'] != null) 'q': list.filters['q']!});
  }

  Future<void> _add() async {
    final ok = await showModalBottomSheet<bool>(context: context, isScrollControlled: true, builder: (_) => DoctorForm(api: api));
    if (ok == true) {
      list.refresh();
      if (mounted) toast(context, 'Doctor created');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(onPressed: _add, icon: const Icon(Icons.add_rounded), label: const Text('Add doctor')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: Row(children: [
            Expanded(child: DebouncedSearch(hint: 'Search name, specialization, hospital', onChanged: list.setQuery)),
            const SizedBox(width: 10),
            ListenableBuilder(
              listenable: list,
              builder: (_, _) => Badge(
                isLabelVisible: list.hasActiveFilters,
                backgroundColor: AppColors.primary,
                smallSize: 10,
                child: IconButton.filledTonal(
                  style: IconButton.styleFrom(backgroundColor: AppColors.raise, minimumSize: const Size(52, 52), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  onPressed: _filters,
                  icon: const Icon(Icons.tune_rounded),
                ),
              ),
            ),
          ]),
        ),
        Expanded(
          child: PagedListView<Doctor>(
            list: list,
            emptyIcon: Icons.medical_services_outlined,
            emptyTitle: 'No doctors found',
            emptyText: 'Try changing your search or filters.',
            itemBuilder: (context, d) => _DoctorCard(
              doctor: d,
              onTap: () async {
                await Navigator.push(context, MaterialPageRoute(builder: (_) => DoctorDetailScreen(doctor: d)));
                list.refresh(); // patient counts may have changed
              },
            ),
          ),
        ),
      ]),
    );
  }
}

class _DoctorCard extends StatelessWidget {
  const _DoctorCard({required this.doctor, required this.onTap});
  final Doctor doctor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final d = doctor;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            InitialsAvatar(d.name, size: 50),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(d.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 2),
                Text(d.hospital, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                const SizedBox(height: 8),
                Pill(d.specialization),
              ]),
            ),
            Column(children: [
              Text('${d.patientCount}', style: head(24)),
              const Text('patients', style: TextStyle(color: AppColors.muted, fontSize: 11)),
            ]),
          ]),
        ),
      ),
    );
  }
}
