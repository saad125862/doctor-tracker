'use client';
import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { FIELD_TYPES, typeLabel } from '@/lib/customFields';
import { useCustomFields } from '@/hooks/useCustomFields';
import { Badge, EmptyState, ErrorState, TableSkeleton } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/Modal';

const ENTITIES = [
  { value: 'doctor', label: 'Doctors' },
  { value: 'patient', label: 'Patients' },
];

function FieldForm({ entity, field, pending, error, onSubmit, onCancel }) {
  const editing = !!field;
  const [label, setLabel] = useState(field?.label || '');
  const [type, setType] = useState(field?.type || 'text');
  const [options, setOptions] = useState((field?.options || []).join('\n'));
  const [required, setRequired] = useState(field?.required || false);
  const errors = Object.fromEntries((error?.errors || []).map((e) => [e.field, e.message]));

  function submit(e) {
    e.preventDefault();
    const opts = options.split('\n').map((o) => o.trim()).filter(Boolean);
    onSubmit(editing ? { label, required, ...(field.type === 'dropdown' ? { options: opts } : {}) } : { entity, label, type, required, options: type === 'dropdown' ? opts : [] });
  }

  return (
    <form onSubmit={submit}>
      {error && !error.errors && <div className="alert" style={{ marginBottom: 14 }}>{error.message}</div>}
      <div className="form-grid">
        <label className="field full">
          Field name
          <input className="input" required maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Blood group" autoFocus />
          {errors.label && <span className="field-err">{errors.label}</span>}
        </label>
        <label className="field full">
          Type
          <select className="input" value={type} disabled={editing} onChange={(e) => setType(e.target.value)}>
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {editing && <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>The type can&apos;t be changed after the field is created.</span>}
        </label>
        {type === 'dropdown' && (
          <label className="field full">
            Options (one per line)
            <textarea className="input" rows={5} value={options} onChange={(e) => setOptions(e.target.value)} placeholder={'A+\nB+\nO+'} />
            {errors.options && <span className="field-err">{errors.options}</span>}
          </label>
        )}
        <label className="field full check-field">
          <span className="checkbox-row">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Required when adding a {entity}
          </span>
        </label>
      </div>
      <div className="form-foot">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" disabled={pending}>
          {pending ? 'Saving…' : editing ? 'Save changes' : 'Add field'}
        </button>
      </div>
    </form>
  );
}

export default function CustomFieldsPage() {
  const qc = useQueryClient();
  const [entity, setEntity] = useState('doctor');
  const [editing, setEditing] = useState(null); // field | 'new' | null
  const [toDelete, setToDelete] = useState(null);
  const { data: fields = [], isLoading, error } = useCustomFields(entity);

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ['custom-fields'] }), [qc]);
  const closeEdit = useCallback(() => setEditing(null), []);

  const save = useMutation({
    mutationFn: (body) => (editing === 'new' ? api('/custom-fields', { method: 'POST', body }) : api(`/custom-fields/${editing._id}`, { method: 'PATCH', body })),
    onSuccess: () => {
      refresh();
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id) => api(`/custom-fields/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refresh();
      setToDelete(null);
    },
  });
  const reorder = useMutation({
    mutationFn: (ids) => api('/custom-fields/reorder', { method: 'PUT', body: { entity, ids } }),
    onSuccess: refresh,
  });

  function move(index, dir) {
    const ids = fields.map((f) => f._id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorder.mutate(ids);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Custom fields</h1>
          <p>Add your own fields to the doctor and patient forms</p>
        </div>
        <button
          className="btn"
          onClick={() => {
            save.reset();
            setEditing('new');
          }}
        >
          ＋ Add field
        </button>
      </div>

      <div className="tabs" role="tablist">
        {ENTITIES.map((e) => (
          <button key={e.value} role="tab" aria-selected={entity === e.value} className={`tab ${entity === e.value ? 'on' : ''}`} onClick={() => setEntity(e.value)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="card">
        {error ? (
          <ErrorState error={error} />
        ) : isLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : fields.length === 0 ? (
          <EmptyState icon="🧩" title="No custom fields yet" text={`Add a field and it will appear on the ${entity} form, profile and list.`} />
        ) : (
          <ul className="field-list">
            {fields.map((f, i) => (
              <li key={f._id}>
                <div className="field-main">
                  <div className="field-name">{f.label}</div>
                  <div className="field-meta">
                    <Badge tone="gray">{typeLabel(f.type)}</Badge>
                    {f.required && <Badge>Required</Badge>}
                    {f.type === 'dropdown' && <span className="muted">{f.options.join(' · ')}</span>}
                  </div>
                </div>
                <div className="actions">
                  <button className="btn btn-ghost btn-sm" aria-label="Move up" disabled={i === 0 || reorder.isPending} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button className="btn btn-ghost btn-sm" aria-label="Move down" disabled={i === fields.length - 1 || reorder.isPending} onClick={() => move(i, 1)}>
                    ↓
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      save.reset();
                      setEditing(f);
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setToDelete(f)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <Modal title={editing === 'new' ? `New ${entity} field` : `Edit “${editing.label}”`} onClose={closeEdit}>
            <FieldForm entity={entity} field={editing === 'new' ? null : editing} pending={save.isPending} error={save.error} onSubmit={save.mutate} onCancel={closeEdit} />
          </Modal>
        )}
        {toDelete && (
          <ConfirmDialog
            title="Delete field"
            message={`Delete “${toDelete.label}”? It disappears from the forms, but values already saved are kept.`}
            loading={remove.isPending}
            error={remove.error}
            onConfirm={() => remove.mutate(toDelete._id)}
            onClose={() => setToDelete(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
