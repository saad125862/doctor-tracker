import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { HttpError, SORTS, dateRange, pageMeta, prefixSearch } from '../utils/helpers.js';

export async function listDoctors(req, res) {
  const { page, limit, q, from, to, sort, specialization, hospital } = req.validQuery;
  const filter = {};
  const search = prefixSearch(q, ['nameLower', 'specializationLower', 'hospitalLower']);
  if (search) Object.assign(filter, search);
  if (specialization) filter.specializationLower = specialization.toLowerCase();
  if (hospital) filter.hospitalLower = hospital.toLowerCase();
  const range = dateRange(from, to);
  if (range) filter.createdAt = range;

  const [items, total] = await Promise.all([
    Doctor.find(filter)
      .select('-nameLower -specializationLower -hospitalLower -__v')
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  // one grouped query for patient counts of the current page (uses the {doctor, createdAt} index)
  const counts = await Patient.aggregate([
    { $match: { doctor: { $in: items.map((d) => d._id) } } },
    { $group: { _id: '$doctor', n: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  const data = items.map((d) => ({ ...d, patientCount: byId.get(String(d._id)) || 0 }));

  res.json({ data, meta: pageMeta(total, page, limit) });
}

export async function doctorFilters(_req, res) {
  const [specializations, hospitals] = await Promise.all([
    Doctor.distinct('specialization'),
    Doctor.distinct('hospital'),
  ]);
  res.json({ specializations: specializations.sort(), hospitals: hospitals.sort() });
}

export async function createDoctor(req, res) {
  const doctor = await Doctor.create(req.body);
  res.status(201).json({ data: doctor });
}

export async function getDoctor(req, res) {
  const doctor = await Doctor.findById(req.params.id).select('-nameLower -specializationLower -hospitalLower -__v').lean();
  if (!doctor) throw new HttpError(404, 'Doctor not found');
  const patientCount = await Patient.countDocuments({ doctor: doctor._id });
  res.json({ data: { ...doctor, patientCount } });
}

export async function deleteDoctor(req, res) {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) throw new HttpError(404, 'Doctor not found');
  await Patient.deleteMany({ doctor: doctor._id });
  res.json({ ok: true });
}

export async function listDoctorPatients(req, res) {
  const { page, limit, q, from, to, sort, condition, gender } = req.validQuery;
  const filter = { doctor: req.params.id };
  const search = prefixSearch(q, ['nameLower', 'conditionLower']);
  if (search) Object.assign(filter, search);
  if (condition) filter.conditionLower = condition.toLowerCase();
  if (gender) filter.gender = gender;
  const range = dateRange(from, to);
  if (range) filter.createdAt = range;

  const [data, total] = await Promise.all([
    Patient.find(filter)
      .select('-nameLower -conditionLower -__v')
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);
  res.json({ data, meta: pageMeta(total, page, limit) });
}

export async function addPatientToDoctor(req, res) {
  const exists = await Doctor.exists({ _id: req.params.id });
  if (!exists) throw new HttpError(404, 'Doctor not found');
  const patient = await Patient.create({ ...req.body, doctor: req.params.id });
  res.status(201).json({ data: patient });
}
