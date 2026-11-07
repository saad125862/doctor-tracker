import { CustomField } from '../models/CustomField.js';
import { HttpError } from '../utils/helpers.js';

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'field';

export async function listFields(req, res) {
  const filter = { archived: false };
  if (req.validQuery.entity) filter.entity = req.validQuery.entity;
  const data = await CustomField.find(filter).sort({ entity: 1, order: 1, createdAt: 1 }).select('-__v').lean();
  res.json({ data });
}

export async function createField(req, res) {
  const { entity, label, type, options, required } = req.body;
  const base = slug(label);
  let key = base;
  for (let i = 2; await CustomField.exists({ entity, key }); i++) key = `${base}_${i}`; // keys stay unique even among archived fields
  const last = await CustomField.findOne({ entity, archived: false }).sort({ order: -1 }).select('order').lean();
  const field = await CustomField.create({
    entity,
    key,
    label,
    type,
    options: type === 'dropdown' ? [...new Set(options)] : [],
    required,
    order: (last?.order ?? -1) + 1,
  });
  res.status(201).json({ data: field });
}

export async function updateField(req, res) {
  const field = await CustomField.findById(req.params.id);
  if (!field || field.archived) throw new HttpError(404, 'Custom field not found');
  const { label, options, required } = req.body;
  if (label !== undefined) field.label = label;
  if (required !== undefined) field.required = required;
  if (options !== undefined) {
    if (field.type !== 'dropdown') throw new HttpError(400, 'Only dropdown fields have options');
    if (options.length < 1) throw new HttpError(400, 'Add at least one option');
    field.options = [...new Set(options)];
  }
  await field.save();
  res.json({ data: field });
}

/** "Delete" hides the field everywhere but keeps values already saved on records. */
export async function archiveField(req, res) {
  const field = await CustomField.findByIdAndUpdate(req.params.id, { archived: true });
  if (!field) throw new HttpError(404, 'Custom field not found');
  res.json({ ok: true });
}

export async function reorderFields(req, res) {
  const { entity, ids } = req.body;
  await CustomField.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id, entity }, update: { $set: { order: i } } } })));
  res.json({ ok: true });
}
