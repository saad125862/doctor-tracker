'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Admin-defined extra fields for 'doctor' or 'patient', in display order. */
export function useCustomFields(entity) {
  return useQuery({
    queryKey: ['custom-fields', entity],
    queryFn: async () => (await api('/custom-fields', { params: { entity } })).data,
    staleTime: 60_000,
  });
}
