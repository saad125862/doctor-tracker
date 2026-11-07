export const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'longtext', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'boolean', label: 'Yes / No' },
];

export const typeLabel = (t) => FIELD_TYPES.find((x) => x.value === t)?.label || t;

export function formatCustomValue(field, value) {
  if (value === undefined || value === null || value === '') return '';
  if (field.type === 'boolean') return value ? 'Yes' : 'No';
  if (field.type === 'date') {
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return String(value);
}

/** [{ id, label, text }] for the fields that have a value, in field order. */
export function customEntries(fields = [], values = {}) {
  return fields
    .map((f) => ({ id: f._id, label: f.label, text: formatCustomValue(f, values?.[f.key]) }))
    .filter((e) => e.text !== '');
}
