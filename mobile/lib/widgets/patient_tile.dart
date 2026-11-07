import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models.dart';
import '../theme.dart';
import 'common.dart';
import 'custom_fields.dart';

class PatientTile extends StatelessWidget {
  const PatientTile({super.key, required this.patient, this.showDoctor = true, this.fields = const [], this.onEdit, this.onDelete});
  final Patient patient;
  final List<CustomField> fields;
  final bool showDoctor;
  final VoidCallback? onEdit, onDelete;

  @override
  Widget build(BuildContext context) {
    final p = patient;
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 4, 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          InitialsAvatar(p.name),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(p.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const SizedBox(height: 2),
              Text(
                [
                  '${p.age} yrs',
                  if (showDoctor && p.doctorName.isNotEmpty) p.doctorName,
                  if (p.createdAt != null) DateFormat('d MMM yyyy').format(p.createdAt!),
                ].join(' · '),
                style: const TextStyle(color: AppColors.muted, fontSize: 12),
              ),
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: 4, children: [
                Pill.gender(p.gender),
                Pill(p.condition, color: const Color(0xFFC3CED8), bg: const Color(0x298B98A5)),
              ]),
              CustomValuesWrap(fields: fields, values: p.custom),
            ]),
          ),
          if (onEdit != null || onDelete != null)
            PopupMenuButton<String>(
              color: AppColors.raise,
              icon: const Icon(Icons.more_vert_rounded, color: AppColors.muted),
              onSelected: (v) => v == 'edit' ? onEdit?.call() : onDelete?.call(),
              itemBuilder: (_) => [
                if (onEdit != null) const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_rounded, size: 18), SizedBox(width: 10), Text('Edit')])),
                if (onDelete != null)
                  const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.danger), SizedBox(width: 10), Text('Delete')])),
              ],
            ),
        ]),
      ),
    );
  }
}
