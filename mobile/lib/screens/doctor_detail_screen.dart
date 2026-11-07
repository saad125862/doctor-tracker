import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../models.dart';
import '../state/auth_state.dart';
import '../state/paged_list.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/forms.dart';
import '../widgets/patient_tile.dart';

class DoctorDetailScreen extends StatefulWidget {
  const DoctorDetailScreen({super.key, required this.doctor});
  final Doctor doctor;

  @override
  State<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends State<DoctorDetailScreen> {
  late final ApiClient api = context.read<AuthState>().api;
  late Doctor doctor = widget.doctor;
  late final PagedList<Patient> list = PagedList<Patient>((page, limit, f) async {
    final res = await api.get('/doctors/${doctor.id}/patients', query: {...f, 'page': page, 'limit': limit});
    return Paged.fromJson(res, Patient.fromJson);
  });

  @override
  void dispose() {
    list.dispose();
    super.dispose();
  }

  Future<void> _reloadDoctor() async {
    try {
      final res = await api.get('/doctors/${doctor.id}');
      if (mounted) setState(() => doctor = Doctor.fromJson(res['data'] as Map<String, dynamic>));
    } catch (_) {}
  }

  Future<void> _addPatient() async {
    final ok = await showModalBottomSheet<bool>(context: context, isScrollControlled: true, builder: (_) => PatientForm(api: api, doctorId: doctor.id));
    if (ok == true) {
      list.refresh();
      _reloadDoctor();
      if (mounted) toast(context, 'Patient added');
    }
  }

  Future<void> _deletePatient(Patient p) async {
    if (!await confirm(context, title: 'Delete patient', message: 'Remove ${p.name} from this doctor\'s list? This cannot be undone.')) return;
    try {
      await api.delete('/patients/${p.id}');
      list.refresh();
      _reloadDoctor();
      if (mounted) toast(context, 'Patient deleted');
    } on ApiException catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  Future<void> _deleteDoctor() async {
    if (!await confirm(context, title: 'Delete doctor', message: 'Delete ${doctor.name} and all ${doctor.patientCount} of their patients? This cannot be undone.')) return;
    try {
      await api.delete('/doctors/${doctor.id}');
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = doctor;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Doctor'),
        actions: [IconButton(onPressed: _deleteDoctor, icon: const Icon(Icons.delete_outline_rounded, color: AppColors.danger), tooltip: 'Delete doctor')],
      ),
      floatingActionButton: FloatingActionButton.extended(onPressed: _addPatient, icon: const Icon(Icons.person_add_alt_1_rounded), label: const Text('Add patient')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  InitialsAvatar(d.name, size: 60),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(d.name, style: head(22)),
                      const SizedBox(height: 6),
                      Pill(d.specialization),
                    ]),
                  ),
                  Column(children: [Text('${d.patientCount}', style: head(28)), const Text('patients', style: TextStyle(color: AppColors.muted, fontSize: 11))]),
                ]),
                const SizedBox(height: 14),
                _Info(Icons.local_hospital_rounded, d.hospital),
                _Info(Icons.phone_rounded, d.phone),
                _Info(Icons.mail_rounded, d.email),
                if (d.createdAt != null) _Info(Icons.event_rounded, 'Joined ${DateFormat('d MMM yyyy').format(d.createdAt!)}'),
              ]),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: DebouncedSearch(hint: 'Search this doctor\'s patients', onChanged: list.setQuery),
        ),
        Expanded(
          child: PagedListView<Patient>(
            list: list,
            emptyIcon: Icons.groups_outlined,
            emptyTitle: 'No patients',
            emptyText: 'This doctor has no patients yet.',
            itemBuilder: (_, p) => PatientTile(patient: p, showDoctor: false, onDelete: () => _deletePatient(p)),
          ),
        ),
      ]),
    );
  }
}

class _Info extends StatelessWidget {
  const _Info(this.icon, this.text);
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Row(children: [
          Icon(icon, size: 16, color: AppColors.muted),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(color: AppColors.muted, fontSize: 13))),
        ]),
      );
}
