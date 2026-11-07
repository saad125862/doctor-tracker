// Usage: npm run db:check
// Connects with MONGODB_URI, pings the server and prints which database/collections it sees.
// Use it to verify an Atlas connection string before deploying. The URI is never printed.
import mongoose from 'mongoose';
import { env } from '../config/env.js';

const host = env.mongoUri.replace(/^mongodb(\+srv)?:\/\//, '').replace(/^[^@/]*@/, '').split(/[/?]/)[0];
console.log(`Connecting to ${host} ...`);

try {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await mongoose.connection.db.admin().ping();
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log(`OK. Database "${mongoose.connection.name}" reachable. Collections: ${cols.map((c) => c.name).join(', ') || '(none yet)'}`);
  if (!mongoose.connection.name || mongoose.connection.name === 'test') {
    console.log('Warning: no database name in the URI, so "test" is used. Add /doctor_tracker before the "?".');
  }
} catch (err) {
  console.error(`FAILED: ${err.message}`);
  console.error('Check: password (URL-encode special characters), Network Access allows your IP / 0.0.0.0/0, cluster finished creating.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
