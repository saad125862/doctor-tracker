'use client';
import { memo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, initials } from '@/lib/format';
import { useListFilters } from '@/hooks/useListFilters';
import { Badge, EmptyState, ErrorState, GenderBadge, Pagination, SearchBox, Skeleton, TableSkeleton } from '@/components/ui';
import { AnimatePresence } from 'framer-motion';
import { MRow } from '@/components/motion';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { PatientForm } from '@/components/Forms';

const Row = memo(function Row({ p, i, onDelete }) {
  return (
    <MRow i={i}>
      <td>
        <div className="name" style={{ fontWeight: 600 }}>{p.name}</div>
        <div className="muted hide-sm" style={{ fontSize: 13 }}>{p.phone || '—'}</div>
      </td>
      <td>{p.age}</td>
      <td><GenderBadge gender={p.gender} /></td>
      <td><Badge tone="gray">{p.condition}</Badge></td>
      <td className="hide-sm muted">{formatDate(p.createdAt)}</td>
      <td>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(p)}>Delete</button>
        </div>
      </td>
    </MRow>
  );
});

export default function DoctorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { state, params, set, setPage } = useListFilters();
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const doctor = useQuery({ queryKey: ['doctor', id], queryFn: () => api(`/doctors/${id}`) });
  const patients = useQuery({
    queryKey: ['doctor-patients', id, params],
    queryFn: () => api(`/doctors/${id}/patients`, { params }),
    placeholderData: keepPreviousData,
  });

  const refresh = useCallback(() => {
    ['doctor', 'doctor-patients', 'doctors', 'patients', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  }, [qc]);

  const add = useMutation({
    mutationFn: (body) => api(`/doctors/${id}/patients`, { method: 'POST', body }),
    onSuccess: () => {
      refresh();
      setAdding(false);
    },
  });
  const remove = useMutation({
    mutationFn: (pid) => api(`/patients/${pid}`, { method: 'DELETE' }),
    onSuccess: () => {
      refresh();
      setToDelete(null);
    },
  });
  const removeDoctor = useMutation({
    mutationFn: () => api(`/doctors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refresh();
      router.replace('/doctors');
    },
  });
  const [deletingDoctor, setDeletingDoctor] = useState(false);

  const closeAdd = useCallback(() => {
    setAdding(false);
    add.reset();
  }, [add]);
  const askDelete = useCallback((p) => setToDelete(p), []);

  const d = doctor.data?.data;

  return (
    <>
      <Link href="/doctors" className="crumb">← Back to doctors</Link>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        {doctor.error ? (
          <ErrorState error={doctor.error} />
        ) : !d ? (
          <Skeleton h={64} />
        ) : (
          <div className="detail-head">
            <div className="avatar lg">{initials(d.name)}</div>
            <div className="info">
              <h1 style={{ fontSize: 24 }}>{d.name}</h1>
              <div style={{ marginTop: 6 }}><Badge>{d.specialization}</Badge></div>
              <div className="detail-meta">
                <span>🏥 {d.hospital}</span>
                <span>📞 {d.phone}</span>
                <span>✉️ {d.email}</span>
                <span>👥 {d.patientCount} patients</span>
                <span>Joined {formatDate(d.createdAt)}</span>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={() => setDeletingDoctor(true)}>Delete doctor</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-head">
          <h3 style={{ margin: 0 }}>Patients</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ minWidth: 220 }}>
              <SearchBox value={state.q} onChange={(q) => set({ q })} placeholder="Search patients…" />
            </div>
            <button className="btn" onClick={() => setAdding(true)}>＋ Add patient</button>
          </div>
        </div>

        {patients.error ? (
          <ErrorState error={patients.error} />
        ) : patients.isLoading ? (
          <TableSkeleton cols={5} />
        ) : patients.data.data.length === 0 ? (
          <EmptyState icon="🧑‍🤝‍🧑" title="No patients" text={state.q ? 'No patient matches your search.' : 'This doctor has no patients yet.'} />
        ) : (
          <div className={`table-wrap ${patients.isPlaceholderData ? 'fade' : ''}`}>
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Condition</th>
                  <th className="hide-sm">Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {patients.data.data.map((p, i) => (
                  <Row key={p._id} p={p} i={i} onDelete={askDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={patients.data?.meta} onPage={setPage} label="patients" />
      </div>

      <AnimatePresence>
        {adding && (
          <Modal title={`Add patient to ${d?.name || 'doctor'}`} onClose={closeAdd}>
            <PatientForm onSubmit={add.mutate} onCancel={closeAdd} pending={add.isPending} error={add.error} />
          </Modal>
        )}
        {toDelete && (
          <ConfirmDialog
            title="Delete patient"
            message={`Remove ${toDelete.name} from this doctor's list? This cannot be undone.`}
            loading={remove.isPending}
            error={remove.error}
            onConfirm={() => remove.mutate(toDelete._id)}
            onClose={() => setToDelete(null)}
          />
        )}
        {deletingDoctor && (
          <ConfirmDialog
            title="Delete doctor"
            message={`Delete ${d?.name} and all ${d?.patientCount ?? 0} of their patients? This cannot be undone.`}
            loading={removeDoctor.isPending}
            error={removeDoctor.error}
            onConfirm={() => removeDoctor.mutate()}
            onClose={() => setDeletingDoctor(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
