import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const dateStr = z.coerce.date().optional();
const listBase = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).optional(),
  from: dateStr,
  to: dateStr,
  sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
};

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const doctorBody = z.object({
  name: z.string().trim().min(2).max(100),
  specialization: z.string().trim().min(2).max(100),
  hospital: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email(),
});

export const doctorQuery = z.object({
  ...listBase,
  specialization: z.string().trim().optional(),
  hospital: z.string().trim().optional(),
});

export const patientBody = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(0).max(130),
  gender: z.enum(['male', 'female', 'other']),
  condition: z.string().trim().min(2).max(150),
  phone: z.string().trim().max(20).optional().default(''),
});

export const patientUpdateBody = patientBody
  .partial()
  .extend({ phone: z.string().trim().max(20).optional(), doctor: objectId.optional() });

export const patientQuery = z.object({
  ...listBase,
  condition: z.string().trim().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  doctor: objectId.optional(),
});

export const idParam = z.object({ id: objectId });
export const dashboardQuery = z.object({ days: z.coerce.number().int().min(7).max(365).default(30) });
