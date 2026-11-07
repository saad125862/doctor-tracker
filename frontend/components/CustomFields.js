'use client';
import { useCustomFields } from '@/hooks/useCustomFields';
import { customEntries } from '@/lib/customFields';

/** One muted line of "Label: value" pairs, for table rows. */
export function CustomLine({ fields, values }) {
  const items = customEntries(fields, values);
  if (!items.length) return null;
  return (
    <div className="custom-line">
      {items.map((e) => (
        <span key={e.id}>
          <b>{e.label}:</b> {e.text}
        </span>
      ))}
    </div>
  );
}

/**
 * Renders the admin-defined fields inside a form. Values live in `form.custom[key]`;
 * server validation errors arrive as errors['custom.<key>'].
 */
export default function CustomFields({ entity, form, setForm, errors }) {
  const { data: fields = [] } = useCustomFields(entity);
  if (!fields.length) return null;

  const values = form.custom || {};
  const set = (key, v) => setForm((f) => ({ ...f, custom: { ...(f.custom || {}), [key]: v } }));

  return (
    <>
      <div className="full custom-divider">Additional details</div>
      {fields.map((f) => {
        const err = errors?.[`custom.${f.key}`];
        // one span so the label text and the asterisk stay on the same line inside the flex column
        const label = (
          <span>
            {f.label}
            {f.required && <span className="req"> *</span>}
          </span>
        );

        if (f.type === 'boolean') {
          return (
            <label key={f._id} className="field check-field">
              <span className="checkbox-row">
                <input type="checkbox" checked={values[f.key] === true} onChange={(e) => set(f.key, e.target.checked)} />
                {label}
              </span>
              {err && <span className="field-err">{err}</span>}
            </label>
          );
        }

        return (
          <label key={f._id} className={`field ${f.type === 'longtext' ? 'full' : ''}`}>
            {label}
            {f.type === 'longtext' ? (
              <textarea className="input" rows={3} value={values[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
            ) : f.type === 'dropdown' ? (
              <select className="input" value={values[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                <option value="">{f.required ? 'Select…' : 'None'}</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                step={f.type === 'number' ? 'any' : undefined}
                value={values[f.key] ?? ''}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
            {err && <span className="field-err">{err}</span>}
          </label>
        );
      })}
    </>
  );
}
