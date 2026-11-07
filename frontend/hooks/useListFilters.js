'use client';
import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Shared state for every paginated/searchable/filterable list.
 * - `state` drives the inputs (instant), `params` drives the query (search is debounced)
 * - changing any filter resets to page 1
 */
export function useListFilters(initial = {}) {
  const base = useMemo(() => ({ page: 1, limit: 10, q: '', sort: 'newest', ...initial }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [state, setState] = useState(base);
  const debouncedQ = useDebounce(state.q, 350);

  const set = useCallback((patch) => setState((s) => ({ ...s, page: 1, ...patch })), []);
  const setPage = useCallback((page) => setState((s) => ({ ...s, page })), []);
  const reset = useCallback(() => setState(base), [base]);
  const params = useMemo(() => ({ ...state, q: debouncedQ }), [state, debouncedQ]);
  const active = ['q', 'from', 'to', 'specialization', 'hospital', 'condition', 'gender', 'doctor'].some((k) => state[k]);

  return { state, params, set, setPage, reset, active };
}
