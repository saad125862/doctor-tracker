import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../models.dart';
import '../theme.dart';

/// Active custom fields for 'doctor' or 'patient', in display order.
Future<List<CustomField>> loadCustomFields(ApiClient api, String entity) async {
  final res = await api.get('/custom-fields', query: {'entity': entity});
  return ((res['data'] as List?) ?? []).map((e) => CustomField.fromJson(e as Map<String, dynamic>)).toList();
}

/// The "Additional details" part of a form. Values live in [values]; server errors arrive as errors['custom.<key>'].
class CustomFieldInputs extends StatelessWidget {
  const CustomFieldInputs({super.key, required this.fields, required this.values, required this.errors, required this.onChanged});
  final List<CustomField> fields;
  final Map<String, dynamic> values;
  final Map<String, String> errors;
  final void Function(String key, dynamic value) onChanged;

  @override
  Widget build(BuildContext context) {
    if (fields.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const SizedBox(height: 22),
      const Divider(),
      const SizedBox(height: 10),
      const Text('ADDITIONAL DETAILS', style: TextStyle(color: AppColors.muted, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.1)),
      for (final f in fields) ...[const SizedBox(height: 14), _input(context, f)],
    ]);
  }

  Widget _input(BuildContext context, CustomField f) {
    final label = f.required ? '${f.label} *' : f.label;
    final err = errors['custom.${f.key}'];
    final v = values[f.key];

    switch (f.type) {
      case 'boolean':
        return SwitchListTile(
          contentPadding: EdgeInsets.zero,
          activeThumbColor: AppColors.primary,
          title: Text(f.label, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: err == null ? null : Text(err, style: const TextStyle(color: AppColors.danger)),
          value: v == true,
          onChanged: (x) => onChanged(f.key, x),
        );
      case 'dropdown':
        return DropdownButtonFormField<String>(
          initialValue: f.options.contains(v) ? v as String : null,
          isExpanded: true,
          dropdownColor: AppColors.raise,
          decoration: InputDecoration(labelText: label, errorText: err),
          items: [for (final o in f.options) DropdownMenuItem(value: o, child: Text(o, overflow: TextOverflow.ellipsis))],
          onChanged: (x) => onChanged(f.key, x),
        );
      case 'date':
        return InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () async {
            final now = DateTime.now();
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime.tryParse(v?.toString() ?? '') ?? now,
              firstDate: DateTime(1900),
              lastDate: DateTime(now.year + 5),
            );
            if (picked != null) {
              onChanged(f.key, '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}');
            }
          },
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: label,
              errorText: err,
              suffixIcon: v == null || v.toString().isEmpty
                  ? const Icon(Icons.calendar_today_rounded, size: 18, color: AppColors.muted)
                  : IconButton(icon: const Icon(Icons.close_rounded, size: 18), onPressed: () => onChanged(f.key, '')),
            ),
            child: Text(f.format(v).isEmpty ? 'Select a date' : f.format(v), style: TextStyle(color: f.format(v).isEmpty ? const Color(0xFF6B7A8A) : AppColors.text)),
          ),
        );
      default:
        return TextFormField(
          key: ValueKey('cf-${f.id}'),
          initialValue: v?.toString() ?? '',
          minLines: f.type == 'longtext' ? 3 : 1,
          maxLines: f.type == 'longtext' ? 5 : 1,
          keyboardType: f.type == 'number' ? const TextInputType.numberWithOptions(decimal: true, signed: true) : (f.type == 'longtext' ? TextInputType.multiline : TextInputType.text),
          decoration: InputDecoration(labelText: label, errorText: err),
          onChanged: (x) => onChanged(f.key, x),
        );
    }
  }
}

/// "Label: value" lines for lists and profiles.
class CustomValuesWrap extends StatelessWidget {
  const CustomValuesWrap({super.key, required this.fields, required this.values});
  final List<CustomField> fields;
  final Map<String, dynamic> values;

  @override
  Widget build(BuildContext context) {
    final items = customEntries(fields, values);
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Wrap(spacing: 12, runSpacing: 2, children: [
        for (final e in items)
          Text.rich(
            TextSpan(children: [
              TextSpan(text: '${e.$1}: ', style: const TextStyle(color: Color(0xFFB6C2CE), fontWeight: FontWeight.w600)),
              TextSpan(text: e.$2),
            ]),
            style: const TextStyle(color: AppColors.muted, fontSize: 12),
          ),
      ]),
    );
  }
}
