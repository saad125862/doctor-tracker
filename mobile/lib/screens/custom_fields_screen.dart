import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../models.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/custom_fields.dart';

/// Define extra fields for the doctor and patient forms. Drag to reorder.
class CustomFieldsScreen extends StatefulWidget {
  const CustomFieldsScreen({super.key});

  @override
  State<CustomFieldsScreen> createState() => _CustomFieldsScreenState();
}

class _CustomFieldsScreenState extends State<CustomFieldsScreen> {
  late final ApiClient api = context.read<AuthState>().api;
  String entity = 'doctor';
  List<CustomField> fields = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final f = await loadCustomFields(api, entity);
      if (mounted) setState(() => fields = f);
    } on ApiException catch (e) {
      if (mounted) setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _edit([CustomField? field]) async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _FieldForm(api: api, entity: entity, field: field),
    );
    if (ok == true) _load();
  }

  Future<void> _delete(CustomField f) async {
    if (!await confirm(context, title: 'Delete field', message: 'Delete "${f.label}"? It disappears from the forms, but values already saved are kept.')) return;
    try {
      await api.delete('/custom-fields/${f.id}');
      _load();
    } on ApiException catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  Future<void> _reorder(int from, int to) async {
    final next = [...fields];
    next.insert(to, next.removeAt(from));
    setState(() => fields = next); // optimistic
    try {
      await api.put('/custom-fields/reorder', body: {'entity': entity, 'ids': next.map((f) => f.id).toList()});
    } on ApiException catch (e) {
      if (mounted) toast(context, e.message);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Custom fields')),
      floatingActionButton: FloatingActionButton.extended(onPressed: () => _edit(), icon: const Icon(Icons.add_rounded), label: const Text('Add field')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: SegmentedButton<String>(
            style: SegmentedButton.styleFrom(selectedBackgroundColor: AppColors.raise, selectedForegroundColor: AppColors.primary),
            segments: const [ButtonSegment(value: 'doctor', label: Text('Doctors')), ButtonSegment(value: 'patient', label: Text('Patients'))],
            selected: {entity},
            onSelectionChanged: (s) {
              entity = s.first;
              _load();
            },
          ),
        ),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : error != null
                  ? ErrorView(error!, onRetry: _load)
                  : fields.isEmpty
                      ? EmptyView(icon: Icons.extension_outlined, title: 'No custom fields yet', text: 'Add a field and it appears on the $entity form and profile.')
                      : ReorderableListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                          itemCount: fields.length,
                          onReorderItem: _reorder,
                          proxyDecorator: (child, _, _) => Material(color: Colors.transparent, child: child),
                          itemBuilder: (context, i) {
                            final f = fields[i];
                            return Padding(
                              key: ValueKey(f.id),
                              padding: const EdgeInsets.only(bottom: 10),
                              child: Card(
                                child: ListTile(
                                  contentPadding: const EdgeInsets.only(left: 16, right: 4),
                                  title: Text(f.label, style: const TextStyle(fontWeight: FontWeight.w700)),
                                  subtitle: Padding(
                                    padding: const EdgeInsets.only(top: 6),
                                    child: Wrap(spacing: 6, runSpacing: 4, crossAxisAlignment: WrapCrossAlignment.center, children: [
                                      Pill(fieldTypeLabel(f.type), color: const Color(0xFFC3CED8), bg: const Color(0x298B98A5)),
                                      if (f.required) const Pill('Required'),
                                      if (f.type == 'dropdown') Text(f.options.join(' · '), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                    ]),
                                  ),
                                  trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                                    PopupMenuButton<String>(
                                      color: AppColors.raise,
                                      icon: const Icon(Icons.more_vert_rounded, color: AppColors.muted),
                                      onSelected: (v) => v == 'edit' ? _edit(f) : _delete(f),
                                      itemBuilder: (_) => const [
                                        PopupMenuItem(value: 'edit', child: Text('Edit')),
                                        PopupMenuItem(value: 'delete', child: Text('Delete')),
                                      ],
                                    ),
                                    ReorderableDragStartListener(index: i, child: const Padding(padding: EdgeInsets.all(8), child: Icon(Icons.drag_handle_rounded, color: AppColors.muted))),
                                  ]),
                                ),
                              ),
                            );
                          },
                        ),
        ),
      ]),
    );
  }
}

class _FieldForm extends StatefulWidget {
  const _FieldForm({required this.api, required this.entity, this.field});
  final ApiClient api;
  final String entity;
  final CustomField? field;

  @override
  State<_FieldForm> createState() => _FieldFormState();
}

class _FieldFormState extends State<_FieldForm> {
  final _key = GlobalKey<FormState>();
  late final label = TextEditingController(text: widget.field?.label);
  late final options = TextEditingController(text: widget.field?.options.join('\n'));
  late String type = widget.field?.type ?? 'text';
  late bool required = widget.field?.required ?? false;
  Map<String, String> errors = {};
  String? general;
  bool saving = false;

  bool get editing => widget.field != null;

  Future<void> _submit() async {
    setState(() => errors = {});
    if (!_key.currentState!.validate()) return;
    setState(() {
      saving = true;
      general = null;
    });
    final opts = options.text.split('\n').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    try {
      if (editing) {
        await widget.api.patch('/custom-fields/${widget.field!.id}', body: {'label': label.text.trim(), 'required': required, if (type == 'dropdown') 'options': opts});
      } else {
        await widget.api.post('/custom-fields', body: {'entity': widget.entity, 'label': label.text.trim(), 'type': type, 'required': required, 'options': type == 'dropdown' ? opts : []});
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
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Form(
          key: _key,
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(editing ? 'Edit field' : 'New ${widget.entity} field', style: head(22)),
            const SizedBox(height: 16),
            TextFormField(
              controller: label,
              maxLength: 60,
              decoration: InputDecoration(labelText: 'Field name', counterText: '', errorText: errors['label']),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: type,
              dropdownColor: AppColors.raise,
              decoration: InputDecoration(labelText: 'Type', helperText: editing ? 'The type cannot be changed after creation' : null),
              items: [for (final t in fieldTypes) DropdownMenuItem(value: t.$1, child: Text(t.$2))],
              onChanged: editing ? null : (v) => setState(() => type = v ?? 'text'),
            ),
            if (type == 'dropdown') ...[
              const SizedBox(height: 12),
              TextFormField(
                controller: options,
                minLines: 3,
                maxLines: 6,
                decoration: InputDecoration(labelText: 'Options (one per line)', alignLabelWithHint: true, errorText: errors['options']),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Add at least one option' : null,
              ),
            ],
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              activeThumbColor: AppColors.primary,
              title: Text('Required when adding a ${widget.entity}'),
              value: required,
              onChanged: (v) => setState(() => required = v),
            ),
            if (general != null) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(general!, style: const TextStyle(color: AppColors.danger))),
            const SizedBox(height: 6),
            FilledButton(onPressed: saving ? null : _submit, child: Text(saving ? 'Saving...' : (editing ? 'Save changes' : 'Add field'))),
          ]),
        ),
      ),
    );
  }
}
