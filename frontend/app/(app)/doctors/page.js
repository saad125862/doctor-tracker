'use client';
import { memo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, initials } from '@/lib/format';
import { useListFilters } from '@/hooks/useListFilters';
import { Badge, DateInput, EmptyState, ErrorState, Pagination, SearchBox, Select, TableSkeleton } from '@/components/ui';
import { AnimatePresence } from 'framer-motion';
import { MRow } from '@/components/motion';
import { Modal } from '@/components/Modal';
import { DoctorForm } from '@/components/Forms';

const Row = memo(function Row({ d, i }) {
  return (
    <MRow i={i}>
      <td>
        <Link href={`/doctors/${d._id}`} className="cell-user">
          <div className="avatar">{initials(d.name)}</div>
          <div>
            <div className="name">{d.name}</div>
            <div className="meta">{d.email}</div>
          </div>
        </Link>
      </td>
      <td>
        <Badge>{d.specialization}</Badge>
      </td>
      <td className="hide-sm">{d.hospital}</td>
      <td className="hide-sm">{d.phone}</td>
      <td>{d.patientCount}</td>
      <td className="hide-sm muted">{formatDate(d.createdAt)}</td>
    </MRow>
  );
});

export default function DoctorsPage() {
  const qc = useQueryClient();
  const { state, params, set, setPage, reset, active } = useListFilters();
  const [adding, setAdding] = useState(false);

  const { data, error, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['doctors', params],
    queryFn: () => api('/doctors', { params }),
    placeholderData: keepPreviousData,
  });
  const { data: filters } = useQuery({ queryKey: ['doctor-filters'], queryFn: () => api('/doctors/filters'), staleTime: 5 * 60_000 });

  const create = useMutation({
    mutationFn: (body) => api('/doctors', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['doctor-filters'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setAdding(false);
    },
  });
  const closeAdd = useCallback(() => {
    setAdding(false);
    create.reset();
  }, [create]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Doctors</h1>
          <p>Manage doctors and open a profile to see their patients</p>
        </div>
        <button className="btn" onClick={() => setAdding(true)}>
          ＋ Add doctor
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <SearchBox value={state.q} onChange={(q) => set({ q })} placeholder="Search name, specialization, hospital…" />
          <Select label="Specialization" value={state.specialization} onChange={(v) => set({ specialization: v })} options={filters?.specializations || []} />
          <Select label="Hospital" value={state.hospital} onChange={(v) => set({ hospital: v })} options={filters?.hospitals || []} />
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
          <TableSkeleton cols={5} />
        ) : data.data.length === 0 ? (
          <EmptyState icon="🩺" title="No doctors found" text={active ? 'Try changing or clearing your filters.' : 'Add your first doctor to get started.'} />
        ) : (
          <div className={`table-wrap ${isPlaceholderData ? 'fade' : ''}`}>
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th className="hide-sm">Hospital</th>
                  <th className="hide-sm">Phone</th>
                  <th>Patients</th>
                  <th className="hide-sm">Added</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((d, i) => (
                  <Row key={d._id} d={d} i={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={data?.meta} onPage={setPage} label="doctors" />
      </div>

      <AnimatePresence>
        {adding && (
          <Modal title="Add doctor" onClose={closeAdd}>
            <DoctorForm onSubmit={create.mutate} onCancel={closeAdd} pending={create.isPending} error={create.error} />
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
