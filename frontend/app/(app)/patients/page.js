'use client';
import { memo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useListFilters } from '@/hooks/useListFilters';
import { Badge, DateInput, EmptyState, ErrorState, GenderBadge, Pagination, SearchBox, Select, TableSkeleton } from '@/components/ui';
import { AnimatePresence } from 'framer-motion';
import { MRow } from '@/components/motion';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { PatientForm } from '@/components/Forms';

const Row = memo(function Row({ p, i, onEdit, onDelete }) {
  return (
    <MRow i={i}>
      <td>
        <div style={{ fontWeight: 600 }}>{p.name}</div>
        <div className="muted hide-sm" style={{ fontSize: 13 }}>{p.phone || '—'}</div>
      </td>
      <td>{p.age}</td>
      <td><GenderBadge gender={p.gender} /></td>
      <td><Badge tone="gray">{p.condition}</Badge></td>
      <td className="hide-sm">
        {p.doctor ? <Link href={`/doctors/${p.doctor._id}`} style={{ color: 'var(--primary-dark)', fontWeight: 500 }}>{p.doctor.name}</Link> : '—'}
      </td>
      <td className="hide-sm muted">{formatDate(p.createdAt)}</td>
      <td>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(p)}>Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(p)}>Delete</button>
        </div>
      </td>
    </MRow>
  );
});

export default function PatientsPage() {
  const qc = useQueryClient();
  const { state, params, set, setPage, reset, active } = useListFilters();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const { data, error, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['patients', params],
    queryFn: () => api('/patients', { params }),
    placeholderData: keepPreviousData,
  });
  const { data: conditions } = useQuery({ queryKey: ['conditions'], queryFn: () => api('/patients/conditions'), staleTime: 5 * 60_000 });
  const { data: doctors } = useQuery({ queryKey: ['doctor-options'], queryFn: () => api('/doctors', { params: { limit: 100, sort: 'name' } }), staleTime: 5 * 60_000 });

  const refresh = useCallback(() => {
    ['patients', 'conditions', 'doctors', 'doctor-patients', 'doctor', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  }, [qc]);

  const update = useMutation({
    mutationFn: ({ id, body }) => api(`/patients/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      refresh();
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id) => api(`/patients/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refresh();
      setToDelete(null);
    },
  });

  const onEdit = useCallback((p) => setEditing(p), []);
  const onDelete = useCallback((p) => setToDelete(p), []);
  const closeEdit = useCallback(() => {
    setEditing(null);
    update.reset();
  }, [update]);

  const doctorOptions = (doctors?.data || []).map((d) => ({ value: d._id, label: d.name }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Patients</h1>
          <p>All patients across every doctor</p>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <SearchBox value={state.q} onChange={(q) => set({ q })} placeholder="Search name or condition…" />
          <Select label="Condition" value={state.condition} onChange={(v) => set({ condition: v })} options={conditions?.conditions || []} />
          <Select
            label="Gender"
            value={state.gender}
            onChange={(v) => set({ gender: v })}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Select label="Doctor" value={state.doctor} onChange={(v) => set({ doctor: v })} options={doctorOptions} />
          <DateInput label="Added from" value={state.from} onChange={(v) => set({ from: v })} />
          <DateInput label="Added to" value={state.to} onChange={(v) => set({ to: v })} />
          <Select
            label="Sort"
            value={state.sort}
            onChange={(v) => set({ sort: v || 'newest' })}
            placeholder="Newest"
            options={[
              { value: 'oldest', label: 'Oldest' },
              { value: 'name', label: 'Name A–Z' },
            ]}
          />
          {active && (
            <button className="btn btn-ghost" onClick={reset}>
              Clear
            </button>
          )}
        </div>

        {error ? (
          <ErrorState error={error} />
        ) : isLoading ? (
          <TableSkeleton cols={6} />
        ) : data.data.length === 0 ? (
          <EmptyState icon="🧑‍🤝‍🧑" title="No patients found" text="Try changing or clearing your filters." />
        ) : (
          <div className={`table-wrap ${isPlaceholderData ? 'fade' : ''}`}>
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Condition</th>
                  <th className="hide-sm">Doctor</th>
                  <th className="hide-sm">Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.data.map((p, i) => (
                  <Row key={p._id} p={p} i={i} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={data?.meta} onPage={setPage} label="patients" />
      </div>

      <AnimatePresence>
        {editing && (
          <Modal title="Edit patient" onClose={closeEdit}>
            <PatientForm
              patient={editing}
              doctors={doctors?.data || []}
              onSubmit={(body) => update.mutate({ id: editing._id, body: { ...body, age: Number(body.age) } })}
              onCancel={closeEdit}
              pending={update.isPending}
              error={update.error}
            />
          </Modal>
        )}
        {toDelete && (
          <ConfirmDialog
            title="Delete patient"
            message={`Delete ${toDelete.name}? This cannot be undone.`}
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
