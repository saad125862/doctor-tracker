import { CustomField } from '../models/CustomField.js';
import { ValidationError } from './helpers.js';

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** Convert and check one raw value against its field definition. Throws a message string on failure. */
function coerce(field, raw) {
  switch (field.type) {
    case 'number': {
      const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
      if (!Number.isFinite(n)) throw 'Must be a number';
      return n;
    }
    case 'date': {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) throw 'Must be a valid date';
      return d.toISOString().slice(0, 10);
    }
    case 'dropdown': {
      if (!field.options.includes(String(raw))) throw 'Choose one of the listed options';
      return String(raw);
    }
    case 'boolean': {
      if (raw === true || raw === 'true') return true;
      if (raw === false || raw === 'false') return false;
      throw 'Must be yes or no';
    }
    case 'longtext': {
      const t = String(raw).trim();
      if (t.length > 2000) throw 'Too long (max 2000 characters)';
      return t;
    }
    default: {
      const t = String(raw).trim();
      if (t.length > 300) throw 'Too long (max 300 characters)';
      return t;
    }
  }
}

/**
 * Validate custom values against the entity's active field definitions.
 * - create (default): every required field must have a value; unknown keys are dropped.
 * - partial (update): only keys present in `input` are checked; an empty value clears that key.
 * Returns { set, clear } where `set` is the cleaned values and `clear` the keys to remove.
 */
export async function validateCustom(entity, input, { partial = false } = {}) {
  const fields = await CustomField.find({ entity, archived: false }).lean();
  const src = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const set = {};
  const clear = [];
  const errors = [];

  for (const f of fields) {
    const present = Object.prototype.hasOwnProperty.call(src, f.key);
    if (partial && !present) continue;
    const raw = src[f.key];

    if (isEmpty(raw)) {
      if (f.type === 'boolean' && !partial) set[f.key] = false; // an unticked box is "no"
      else if (f.required && f.type !== 'boolean') errors.push({ field: `custom.${f.key}`, message: `${f.label} is required` });
      else clear.push(f.key);
      continue;
    }
    try {
      set[f.key] = coerce(f, raw);
    } catch (message) {
      errors.push({ field: `custom.${f.key}`, message: String(message) });
    }
  }

  if (errors.length) throw new ValidationError(errors);
  return { set, clear };
}
