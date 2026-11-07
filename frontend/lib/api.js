export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // [{ field, message }] from zod validation
  }
}

const toQuery = (params) => {
  if (!params) return '';
  const clean = Object.entries(params).filter(([, v]) => v !== '' && v != null);
  return clean.length ? `?${new URLSearchParams(clean)}` : '';
};

export async function api(path, { method = 'GET', body, params } = {}) {
  const res = await fetch(`/api${path}${toQuery(params)}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      // clear the stale cookie first, otherwise middleware would bounce us back here
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      window.location.href = '/login';
    }
    throw new ApiError(data.message || 'Request failed', res.status, data.errors);
  }
  return data;
}
