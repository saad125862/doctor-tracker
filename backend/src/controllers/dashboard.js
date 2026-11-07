import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';

const dayKey = (d) => d.toISOString().slice(0, 10);

const perDay = (Model, since) =>
  Model.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, n: { $sum: 1 } } },
  ]);

export async function stats(req, res) {
  const { days } = req.validQuery;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const [totalDoctors, totalPatients, perDoctor, patientDays, doctorDays, conditions, genders, recent] =
    await Promise.all([
      Doctor.estimatedDocumentCount(),
      Patient.estimatedDocumentCount(),
      Patient.aggregate([
        { $group: { _id: '$doctor', patients: { $sum: 1 } } },
        { $sort: { patients: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'd', pipeline: [{ $project: { name: 1, specialization: 1 } }] } },
        { $unwind: '$d' },
        { $project: { _id: 0, doctorId: '$_id', name: '$d.name', specialization: '$d.specialization', patients: 1 } },
      ]),
      perDay(Patient, since),
      perDay(Doctor, since),
      Patient.aggregate([
        { $group: { _id: '$conditionLower', name: { $first: '$condition' }, value: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $limit: 6 },
        { $project: { _id: 0, name: 1, value: 1 } },
      ]),
      Patient.aggregate([{ $group: { _id: '$gender', value: { $sum: 1 } } }, { $project: { _id: 0, name: '$_id', value: 1 } }]),
      Patient.find().sort({ createdAt: -1 }).limit(5).select('name condition createdAt').populate('doctor', 'name').lean(),
    ]);

  const pMap = new Map(patientDays.map((x) => [x._id, x.n]));
  const dMap = new Map(doctorDays.map((x) => [x._id, x.n]));
  const timeline = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const k = dayKey(d);
    timeline.push({ date: k, patients: pMap.get(k) || 0, doctors: dMap.get(k) || 0 });
  }

  const sum = (map) => [...map.values()].reduce((a, b) => a + b, 0);
  res.json({
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      avgPatientsPerDoctor: totalDoctors ? +(totalPatients / totalDoctors).toFixed(1) : 0,
      newPatients: sum(pMap),
      newDoctors: sum(dMap),
    },
    days,
    timeline,
    patientsPerDoctor: perDoctor,
    conditions,
    genders,
    recentPatients: recent,
  });
}
