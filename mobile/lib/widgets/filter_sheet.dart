import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme.dart';

class FilterSpec {
  const FilterSpec.dropdown(this.key, this.label, this.options, {this.allLabel = 'All'}) : isDate = false;
  const FilterSpec.date(this.key, this.label)
      : options = const [],
        allLabel = 'All',
        isDate = true;

  final String key, label, allLabel;

  /// (value, label) pairs for dropdowns.
  final List<(String, String)> options;
  final bool isDate;
}

/// Generic bottom sheet that edits a map of filters. Returns the new map, or null if dismissed.
Future<Map<String, String>?> showFilterSheet(
  BuildContext context, {
  required String title,
  required List<FilterSpec> specs,
  required Map<String, String> initial,
}) {
  return showModalBottomSheet<Map<String, String>>(
    context: context,
    isScrollControlled: true,
    builder: (_) => _FilterSheet(title: title, specs: specs, initial: initial),
  );
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({required this.title, required this.specs, required this.initial});
  final String title;
  final List<FilterSpec> specs;
  final Map<String, String> initial;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late Map<String, String> v = {...widget.initial};

  Future<void> _pickDate(String key) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.tryParse(v[key] ?? '') ?? now,
      firstDate: DateTime(2020),
      lastDate: now.add(const Duration(days: 1)),
    );
    if (picked != null) setState(() => v[key] = DateFormat('yyyy-MM-dd').format(picked));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Row(children: [
            Expanded(child: Text(widget.title, style: head(22))),
            TextButton(onPressed: () => setState(() => v = {}), child: const Text('Clear all')),
          ]),
          const SizedBox(height: 8),
          for (final s in widget.specs) ...[
            Text(s.label, style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            if (s.isDate)
              OutlinedButton.icon(
                onPressed: () => _pickDate(s.key),
                icon: const Icon(Icons.calendar_today_rounded, size: 18),
                label: Align(alignment: Alignment.centerLeft, child: Text((v[s.key] ?? '').isEmpty ? 'Any date' : v[s.key]!)),
              )
            else
              DropdownButtonFormField<String>(
                initialValue: s.options.any((o) => o.$1 == (v[s.key] ?? '')) ? (v[s.key] ?? '') : '',
                dropdownColor: AppColors.raise,
                isExpanded: true,
                items: [
                  DropdownMenuItem(value: '', child: Text(s.allLabel)),
                  for (final o in s.options) DropdownMenuItem(value: o.$1, child: Text(o.$2, overflow: TextOverflow.ellipsis)),
                ],
                onChanged: (x) => setState(() => v[s.key] = x ?? ''),
              ),
            const SizedBox(height: 14),
          ],
          const SizedBox(height: 4),
          FilledButton(onPressed: () => Navigator.pop(context, v), child: const Text('Apply filters')),
        ]),
      ),
    );
  }
}
