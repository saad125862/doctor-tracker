// Usage: npm run seed   (wipes doctors/patients and inserts demo data; keeps users)
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const daysAgo = (n) => new Date(Date.now() - n * 86400000 - Math.random() * 86400000);

const first = ['Aisha', 'Omar', 'Sara', 'Hamza', 'Layla', 'Yusuf', 'Nadia', 'Zain', 'Maryam', 'Bilal', 'Hira', 'Ali', 'Fatima', 'Usman', 'Amna', 'Hassan', 'Zara', 'Imran'];
const last = ['Khan', 'Ahmed', 'Malik', 'Siddiqui', 'Raza', 'Sheikh', 'Hussain', 'Butt', 'Qureshi', 'Farooq', 'Iqbal', 'Mirza'];
const specs = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Oncology', 'Psychiatry', 'General Medicine'];
const hospitals = ['City General Hospital', 'Green Valley Medical Center', 'St. Mary Clinic', 'Sunrise Health Institute', 'Metro Care Hospital'];
const conditions = ['Hypertension', 'Diabetes', 'Asthma', 'Migraine', 'Arthritis', 'Anxiety', 'Fracture', 'Allergy', 'Flu', 'Back Pain'];
const name = () => `${pick(first)} ${pick(last)}`;

await connectDB();
await Promise.all([Doctor.deleteMany({}), Patient.deleteMany({})]);
await Promise.all([Doctor.init(), Patient.init()]);

if (env.adminEmail && env.adminPassword && !(await User.exists({ email: env.adminEmail.toLowerCase() }))) {
  await User.create({ email: env.adminEmail, password: env.adminPassword });
}

const doctors = [];
for (let i = 0; i < 24; i++) {
  const n = `Dr. ${name()}`;
  doctors.push(
    new Doctor({
      name: n,
      specialization: pick(specs),
      hospital: pick(hospitals),
      phone: `+92 3${Math.floor(Math.random() * 90 + 10)} ${Math.floor(1000000 + Math.random() * 8999999)}`,
      email: `${n.toLowerCase().replace(/[^a-z]+/g, '.')}${i}@example.com`,
      createdAt: daysAgo(Math.floor(Math.random() * 60)),
    })
  );
}
await Doctor.insertMany(doctors);

const patients = [];
for (let i = 0; i < 400; i++) {
  patients.push({
    name: name(),
    age: Math.floor(Math.random() * 80) + 1,
    gender: pick(['male', 'female', 'other', 'male', 'female']),
    condition: pick(conditions),
    phone: `+92 3${Math.floor(Math.random() * 90 + 10)} ${Math.floor(1000000 + Math.random() * 8999999)}`,
    doctor: pick(doctors)._id,
    createdAt: daysAgo(Math.floor(Math.random() * 45)),
  });
}
// insertMany skips pre('save') but runs validation hooks, so the lowercase fields are filled in
await Patient.insertMany(patients.map((p) => new Patient(p)));

console.log(`Seeded ${doctors.length} doctors, ${patients.length} patients`);
await mongoose.disconnect();
