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

// values for admin-defined custom fields, checked against their definitions in utils/customFields.js
const customValues = z.record(z.string(), z.any()).optional();

export const doctorBody = z.object({
  name: z.string().trim().min(2).max(100),
  specialization: z.string().trim().min(2).max(100),
  hospital: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email(),
  custom: customValues,
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
  custom: customValues,
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

const entityEnum = z.enum(['doctor', 'patient']);
const optionList = z.array(z.string().trim().min(1).max(60)).max(30);

export const customFieldBody = z
  .object({
    entity: entityEnum,
    label: z.string().trim().min(1).max(60),
    type: z.enum(['text', 'longtext', 'number', 'date', 'dropdown', 'boolean']),
    options: optionList.optional().default([]),
    required: z.boolean().optional().default(false),
  })
  .refine((d) => d.type !== 'dropdown' || d.options.length >= 1, { message: 'Add at least one option', path: ['options'] });

export const customFieldUpdate = z.object({
  label: z.string().trim().min(1).max(60).optional(),
  options: optionList.optional(),
  required: z.boolean().optional(),
});

export const customFieldQuery = z.object({ entity: entityEnum.optional() });
export const customFieldReorder = z.object({ entity: entityEnum, ids: z.array(objectId).min(1).max(100) });

export const idParam = z.object({ id: objectId });
export const dashboardQuery = z.object({ days: z.coerce.number().int().min(7).max(365).default(30) });
