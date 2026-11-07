import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../models.dart';
import '../theme.dart';
import 'custom_fields.dart';

Widget _field(
  String label,
  TextEditingController c,
  Map<String, String> errors,
  String key, {
  TextInputType? type,
  String? Function(String?)? validator,
  bool required = true,
}) {
  return TextFormField(
    controller: c,
    keyboardType: type,
    decoration: InputDecoration(labelText: label, errorText: errors[key]),
    validator: validator ?? (required ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null : null),
  );
}

/// Add-doctor form. Pops with true when the doctor was created.
class DoctorForm extends StatefulWidget {
  const DoctorForm({super.key, required this.api});
  final ApiClient api;

  @override
  State<DoctorForm> createState() => _DoctorFormState();
}

class _DoctorFormState extends State<DoctorForm> {
  final _key = GlobalKey<FormState>();
  final name = TextEditingController(), spec = TextEditingController(), hospital = TextEditingController();
  final phone = TextEditingController(), email = TextEditingController();
  List<CustomField> fields = [];
  final Map<String, dynamic> custom = {};

  @override
  void initState() {
    super.initState();
    loadCustomFields(widget.api, 'doctor').then((f) {
      if (mounted) setState(() => fields = f);
    }).catchError((Object _) {});
  }
  Map<String, String> errors = {};
  String? general;
  bool saving = false;

  Future<void> _submit() async {
    setState(() => errors = {});
    if (!_key.currentState!.validate()) return;
    setState(() {
      saving = true;
      general = null;
    });
    try {
      await widget.api.post('/doctors', body: {
        'name': name.text.trim(),
        'specialization': spec.text.trim(),
        'hospital': hospital.text.trim(),
        'phone': phone.text.trim(),
        'email': email.text.trim(),
        'custom': custom,
      });
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      setState(() {
        errors = e.fields;
        general = e.fields.isEmpty ? e.message : null;
        saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Form(
          key: _key,
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text('Add doctor', style: head(22)),
            const SizedBox(height: 16),
            _field('Full name', name, errors, 'name'),
            const SizedBox(height: 12),
            _field('Specialization', spec, errors, 'specialization'),
            const SizedBox(height: 12),
            _field('Hospital', hospital, errors, 'hospital'),
            const SizedBox(height: 12),
            _field('Phone', phone, errors, 'phone', type: TextInputType.phone),
            const SizedBox(height: 12),
            _field('Email', email, errors, 'email', type: TextInputType.emailAddress),
            CustomFieldInputs(fields: fields, values: custom, errors: errors, onChanged: (k, v) => setState(() => custom[k] = v)),
            if (general != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(general!, style: const TextStyle(color: AppColors.danger))),
            const SizedBox(height: 18),
            FilledButton(onPressed: saving ? null : _submit, child: Text(saving ? 'Saving...' : 'Create doctor')),
          ]),
        ),
      ),
    );
  }
}

/// Add / edit patient form. Pass [patient] to edit (and [doctors] to allow reassigning);
/// pass [doctorId] to add a patient under a specific doctor. Pops with true on success.
class PatientForm extends StatefulWidget {
  const PatientForm({super.key, required this.api, this.patient, this.doctorId, this.doctors});
  final ApiClient api;
  final Patient? patient;
  final String? doctorId;
  final List<Doctor>? doctors;

  @override
  State<PatientForm> createState() => _PatientFormState();
}

class _PatientFormState extends State<PatientForm> {
  final _key = GlobalKey<FormState>();
  late final name = TextEditingController(text: widget.patient?.name);
  late final age = TextEditingController(text: widget.patient == null ? '' : '${widget.patient!.age}');
  late final condition = TextEditingController(text: widget.patient?.condition);
  late final phone = TextEditingController(text: widget.patient?.phone);
  late String gender = widget.patient?.gender.isNotEmpty == true ? widget.patient!.gender : 'male';
  late String? doctor = widget.patient?.doctorId;
  List<CustomField> fields = [];
  late final Map<String, dynamic> custom = {...?widget.patient?.custom};

  @override
  void initState() {
    super.initState();
    loadCustomFields(widget.api, 'patient').then((f) {
      if (mounted) setState(() => fields = f);
    }).catchError((Object _) {});
  }
  Map<String, String> errors = {};
  String? general;
  bool saving = false;

  bool get editing => widget.patient != null;

  Future<void> _submit() async {
    setState(() => errors = {});
    if (!_key.currentState!.validate()) return;
    setState(() {
      saving = true;
      general = null;
    });
    final body = {
      'name': name.text.trim(),
      'age': int.parse(age.text.trim()),
      'gender': gender,
      'condition': condition.text.trim(),
      'phone': phone.text.trim(),
      if (editing && doctor != null) 'doctor': doctor,
      'custom': custom,
    };
    try {
      if (editing) {
        await widget.api.patch('/patients/${widget.patient!.id}', body: body);
      } else {
        await widget.api.post('/doctors/${widget.doctorId}/patients', body: body);
      }
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      setState(() {
        errors = e.fields;
        general = e.fields.isEmpty ? e.message : null;
        saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final docs = widget.doctors;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Form(
          key: _key,
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(editing ? 'Edit patient' : 'Add patient', style: head(22)),
            const SizedBox(height: 16),
            _field('Full name', name, errors, 'name'),
            const SizedBox(height: 12),
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                child: _field('Age', age, errors, 'age', type: TextInputType.number, validator: (v) {
                  final n = int.tryParse((v ?? '').trim());
                  return (n == null || n < 0 || n > 130) ? '0 to 130' : null;
                }),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: gender,
                  dropdownColor: AppColors.raise,
                  decoration: const InputDecoration(labelText: 'Gender'),
                  items: const [
                    DropdownMenuItem(value: 'male', child: Text('Male')),
                    DropdownMenuItem(value: 'female', child: Text('Female')),
                    DropdownMenuItem(value: 'other', child: Text('Other')),
                  ],
                  onChanged: (v) => setState(() => gender = v ?? 'male'),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            _field('Condition', condition, errors, 'condition'),
            const SizedBox(height: 12),
            _field('Phone (optional)', phone, errors, 'phone', type: TextInputType.phone, required: false),
            if (editing && docs != null && docs.isNotEmpty) ...[
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: docs.any((d) => d.id == doctor) ? doctor : null,
                isExpanded: true,
                dropdownColor: AppColors.raise,
                decoration: const InputDecoration(labelText: 'Doctor'),
                items: [for (final d in docs) DropdownMenuItem(value: d.id, child: Text(d.name, overflow: TextOverflow.ellipsis))],
                onChanged: (v) => setState(() => doctor = v),
              ),
            ],
            if (general != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(general!, style: const TextStyle(color: AppColors.danger))),
            CustomFieldInputs(fields: fields, values: custom, errors: errors, onChanged: (k, v) => setState(() => custom[k] = v)),
            const SizedBox(height: 18),
            FilledButton(onPressed: saving ? null : _submit, child: Text(saving ? 'Saving...' : (editing ? 'Save changes' : 'Add patient'))),
          ]),
        ),
      ),
    );
  }
}
