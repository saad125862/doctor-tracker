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
import '../widgets/patient_tile.dart';

class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  late final ApiClient api = context.read<AuthState>().api;
  late final PagedList<Patient> list = PagedList<Patient>((page, limit, f) async {
    final res = await api.get('/patients', query: {...f, 'page': page, 'limit': limit});
    return Paged.fromJson(res, Patient.fromJson);
  });

  @override
  void dispose() {
    list.dispose();
    super.dispose();
  }

  Future<List<Doctor>> _doctors() async {
    final res = await api.get('/doctors', query: {'limit': 100, 'sort': 'name'});
    return ((res['data'] as List?) ?? []).map((e) => Doctor.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> _filters() async {
    List<String> conditions = [];
    List<Doctor> doctors = [];
    try {
      final c = await api.get('/patients/conditions');
      conditions = [for (final e in (c['conditions'] as List? ?? [])) e.toString()];
      doctors = await _doctors();
    } on ApiException catch (e) {
      if (mounted) toast(context, e.message);
    }
    if (!mounted) return;
    final res = await showFilterSheet(
      context,
      title: 'Filter patients',
      initial: list.filters,
      specs: [
        FilterSpec.dropdown('condition', 'Condition', [for (final c in conditions) (c, c)]),
        const FilterSpec.dropdown('gender', 'Gender', [('male', 'Male'), ('female', 'Female'), ('other', 'Other')]),
        FilterSpec.dropdown('doctor', 'Doctor', [for (final d in doctors) (d.id, d.name)]),
        const FilterSpec.date('from', 'Added from'),
        const FilterSpec.date('to', 'Added to'),
        const FilterSpec.dropdown('sort', 'Sort by', [('oldest', 'Oldest first'), ('name', 'Name A to Z')], allLabel: 'Newest first'),
      ],
    );
    if (res != null) list.setFilters({...res, if (list.filters['q'] != null) 'q': list.filters['q']!});
  }

  Future<void> _edit(Patient p) async {
    List<Doctor> doctors = [];
    try {
      doctors = await _doctors();
    } catch (_) {}
    if (!mounted) return;
    final ok = await showModalBottomSheet<bool>(context: context, isScrollControlled: true, builder: (_) => PatientForm(api: api, patient: p, doctors: doctors));
    if (ok == true) {
      list.refresh();
      if (mounted) toast(context, 'Patient updated');
    }
  }

  Future<void> _delete(Patient p) async {
    if (!await confirm(context, title: 'Delete patient', message: 'Delete ${p.name}? This cannot be undone.')) return;
    try {
      await api.delete('/patients/${p.id}');
      list.refresh();
      if (mounted) toast(context, 'Patient deleted');
    } on ApiException catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: Row(children: [
            Expanded(child: DebouncedSearch(hint: 'Search name or condition', onChanged: list.setQuery)),
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
          child: PagedListView<Patient>(
            list: list,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            emptyIcon: Icons.groups_outlined,
            emptyTitle: 'No patients found',
            emptyText: 'Try changing your search or filters.',
            itemBuilder: (_, p) => PatientTile(patient: p, onEdit: () => _edit(p), onDelete: () => _delete(p)),
          ),
        ),
      ]),
    );
  }
}
