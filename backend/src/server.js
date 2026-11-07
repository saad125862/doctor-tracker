import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Doctor } from './models/Doctor.js';
import { Patient } from './models/Patient.js';
import app from './app.js';

async function ensureAdmin() {
  if (!env.adminEmail || !env.adminPassword) return;
  const exists = await User.exists({ email: env.adminEmail.toLowerCase() });
  if (!exists) {
    await User.create({ email: env.adminEmail, password: env.adminPassword, name: 'Admin' });
    console.log(`Admin user created: ${env.adminEmail}`);
  }
}

async function start() {
  await connectDB();
  await Promise.all([User.init(), Doctor.init(), Patient.init()]); // make sure indexes exist
  await ensureAdmin();
  const server = app.listen(env.port, () => console.log(`API listening on :${env.port}`));
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});
