import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { HttpError, SORTS, dateRange, pageMeta, prefixSearch } from '../utils/helpers.js';

export async function listPatients(req, res) {
  const { page, limit, q, from, to, sort, condition, gender, doctor } = req.validQuery;
  const filter = {};
  const search = prefixSearch(q, ['nameLower', 'conditionLower']);
  if (search) Object.assign(filter, search);
  if (condition) filter.conditionLower = condition.toLowerCase();
  if (gender) filter.gender = gender;
  if (doctor) filter.doctor = doctor;
  const range = dateRange(from, to);
  if (range) filter.createdAt = range;

  const [data, total] = await Promise.all([
    Patient.find(filter)
      .select('-nameLower -conditionLower -__v')
      .populate('doctor', 'name specialization')
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);
  res.json({ data, meta: pageMeta(total, page, limit) });
}

export async function patientConditions(_req, res) {
  const conditions = await Patient.distinct('condition');
  res.json({ conditions: conditions.sort() });
}

export async function updatePatient(req, res) {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  if (req.body.doctor && !(await Doctor.exists({ _id: req.body.doctor }))) throw new HttpError(404, 'Doctor not found');
  patient.set(req.body);
  await patient.save(); // runs the hook that refreshes the lowercase search fields
  res.json({ data: patient });
}

export async function deletePatient(req, res) {
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  res.json({ ok: true });
}
