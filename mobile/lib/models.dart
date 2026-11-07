String _s(dynamic v) => v?.toString() ?? '';
DateTime? _d(dynamic v) => v == null ? null : DateTime.tryParse(v.toString())?.toLocal();
int _i(dynamic v) => (v as num?)?.toInt() ?? 0;

class Doctor {
  Doctor.fromJson(Map<String, dynamic> j)
      : id = _s(j['_id']),
        name = _s(j['name']),
        specialization = _s(j['specialization']),
        hospital = _s(j['hospital']),
        phone = _s(j['phone']),
        email = _s(j['email']),
        patientCount = _i(j['patientCount']),
        createdAt = _d(j['createdAt']);

  final String id, name, specialization, hospital, phone, email;
  final int patientCount;
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
        createdAt = _d(j['createdAt']);

  final String id, name, gender, condition, phone, doctorId, doctorName;
  final int age;
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
