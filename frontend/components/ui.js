'use client';
import { memo } from 'react';

export const Skeleton = ({ h = 16, w = '100%' }) => <div className="skeleton" style={{ height: h, width: w }} />;

export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
  <div style={{ padding: 16, display: 'grid', gap: 14 }}>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
        {Array.from({ length: cols }, (_, j) => (
          <Skeleton key={j} h={20} />
        ))}
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon = '🗂️', title, text }) => (
  <div className="empty">
    <div className="big">{icon}</div>
    <strong>{title}</strong>
    <span>{text}</span>
  </div>
);

export const ErrorState = ({ error }) => (
  <div style={{ padding: 20 }}>
    <div className="alert">{error?.message || 'Something went wrong'}</div>
  </div>
);

export const Badge = memo(function Badge({ children, tone = '' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
});

export const GenderBadge = memo(function GenderBadge({ gender }) {
  const tone = gender === 'male' ? 'blue' : gender === 'female' ? 'pink' : 'gray';
  return <Badge tone={tone}>{gender}</Badge>;
});

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <label className="field search">
      <span aria-hidden>🔍</span>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label="Search" />
    </label>
  );
}

export function Select({ label, value, onChange, options, placeholder = 'All' }) {
  return (
    <label className="field">
      {label}
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function DateInput({ label, value, onChange }) {
  return (
    <label className="field">
      {label}
      <input type="date" className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Pagination({ meta, onPage, label = 'results' }) {
  if (!meta) return null;
  const { page, totalPages, total, limit } = meta;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pages = [];
  const from = Math.max(1, Math.min(page - 2, totalPages - 4));
  const to = Math.min(totalPages, from + 4);
  for (let p = from; p <= to; p++) pages.push(p);

  return (
    <div className="pager">
      <span className="muted">
        {start}–{end} of {total} {label}
      </span>
      <div className="pages">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          ‹
        </button>
        {pages.map((p) => (
          <button key={p} className={p === page ? 'on' : ''} onClick={() => onPage(p)}>
            {p}
          </button>
        ))}
        <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          ›
        </button>
      </div>
    </div>
  );
}
