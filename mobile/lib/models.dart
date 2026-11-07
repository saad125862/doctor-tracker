String _s(dynamic v) => v?.toString() ?? '';
DateTime? _d(dynamic v) => v == null ? null : DateTime.tryParse(v.toString())?.toLocal();
int _i(dynamic v) => (v as num?)?.toInt() ?? 0;
Map<String, dynamic> _custom(dynamic v) => v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};

const fieldTypes = <(String, String)>[
  ('text', 'Text'),
  ('longtext', 'Long text'),
  ('number', 'Number'),
  ('date', 'Date'),
  ('dropdown', 'Dropdown'),
  ('boolean', 'Yes / No'),
];

String fieldTypeLabel(String t) => fieldTypes.firstWhere((e) => e.$1 == t, orElse: () => (t, t)).$2;

/// An admin-defined extra field for the doctor or patient forms.
class CustomField {
  CustomField.fromJson(Map<String, dynamic> j)
      : id = _s(j['_id']),
        entity = _s(j['entity']),
        key = _s(j['key']),
        label = _s(j['label']),
        type = _s(j['type']),
        options = ((j['options'] as List?) ?? []).map((e) => e.toString()).toList(),
        required = j['required'] == true;

  final String id, entity, key, label, type;
  final List<String> options;
  final bool required;

  /// Human-readable text for a stored value ('' when empty).
  String format(dynamic v) {
    if (v == null || v.toString().isEmpty) return '';
    if (type == 'boolean') return v == true ? 'Yes' : 'No';
    if (type == 'date') {
      final d = DateTime.tryParse(v.toString());
      if (d != null) return '${d.day.toString().padLeft(2, '0')} ${const ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.month - 1]} ${d.year}';
    }
    return v.toString();
  }
}

/// (label, text) pairs for the fields that have a value.
List<(String, String)> customEntries(List<CustomField> fields, Map<String, dynamic> values) => [
      for (final f in fields)
        if (f.format(values[f.key]).isNotEmpty) (f.label, f.format(values[f.key])),
    ];

class Doctor {
  Doctor.fromJson(Map<String, dynamic> j)
      : id = _s(j['_id']),
        name = _s(j['name']),
        specialization = _s(j['specialization']),
        hospital = _s(j['hospital']),
        phone = _s(j['phone']),
        email = _s(j['email']),
        patientCount = _i(j['patientCount']),
        custom = _custom(j['custom']),
        createdAt = _d(j['createdAt']);

  final String id, name, specialization, hospital, phone, email;
  final int patientCount;

  /// Values of admin-defined custom fields, keyed by CustomField.key.
  final Map<String, dynamic> custom;
  final DateTime? createdAt;
}

class Patient {
  Patient.fromJson(Map<String, dynamic> j)
      : id = _s(j['_id']),
        name = _s(j['name']),
        age = _i(j['age']),
        gender = _s(j['gender']),
        condition = _s(j['condition']),
        phone = _s(j['phone']),
        doctorId = j['doctor'] is Map ? _s((j['doctor'] as Map)['_id']) : _s(j['doctor']),
        doctorName = j['doctor'] is Map ? _s((j['doctor'] as Map)['name']) : '',
        custom = _custom(j['custom']),
        createdAt = _d(j['createdAt']);

  final String id, name, gender, condition, phone, doctorId, doctorName;
  final int age;
  final Map<String, dynamic> custom;
  final DateTime? createdAt;
}

class Paged<T> {
  Paged(this.items, this.page, this.totalPages, this.total);
  final List<T> items;
  final int page, totalPages, total;

  factory Paged.fromJson(Map<String, dynamic> j, T Function(Map<String, dynamic>) parse) {
    final meta = (j['meta'] as Map?) ?? {};
    return Paged<T>(
      ((j['data'] as List?) ?? []).map((e) => parse(e as Map<String, dynamic>)).toList(),
      _i(meta['page']),
      _i(meta['totalPages']),
      _i(meta['total']),
    );
  }
}

class TimelinePoint {
  TimelinePoint(this.date, this.patients, this.doctors);
  final DateTime date;
  final int patients, doctors;
}

class NameValue {
  NameValue(this.name, this.value);
  final String name;
  final int value;
}

class DashboardStats {
  DashboardStats.fromJson(Map<String, dynamic> j)
      : totalDoctors = _i((j['totals'] as Map)['doctors']),
        totalPatients = _i((j['totals'] as Map)['patients']),
        avgPerDoctor = ((j['totals'] as Map)['avgPatientsPerDoctor'] as num?)?.toDouble() ?? 0,
        newPatients = _i((j['totals'] as Map)['newPatients']),
        newDoctors = _i((j['totals'] as Map)['newDoctors']),
        timeline = ((j['timeline'] as List?) ?? [])
            .map((e) => TimelinePoint(DateTime.parse(e['date'] as String), _i(e['patients']), _i(e['doctors'])))
            .toList(),
        perDoctor = ((j['patientsPerDoctor'] as List?) ?? []).map((e) => NameValue(_s(e['name']), _i(e['patients']))).toList(),
        conditions = ((j['conditions'] as List?) ?? []).map((e) => NameValue(_s(e['name']), _i(e['value']))).toList(),
        recent = ((j['recentPatients'] as List?) ?? []).map((e) => Patient.fromJson(e as Map<String, dynamic>)).toList();

  final int totalDoctors, totalPatients, newPatients, newDoctors;
  final double avgPerDoctor;
  final List<TimelinePoint> timeline;
  final List<NameValue> perDoctor, conditions;
  final List<Patient> recent;
}
