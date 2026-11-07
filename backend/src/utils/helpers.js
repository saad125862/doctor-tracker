export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Prefix match on pre-lowercased, indexed fields (an anchored regex can use the index; /i unanchored cannot). */
export function prefixSearch(q, fields) {
  if (!q) return null;
  const re = new RegExp('^' + escapeRegex(q.trim().toLowerCase()));
  return { $or: fields.map((f) => ({ [f]: re })) };
}

export function dateRange(from, to) {
  if (!from && !to) return null;
  const r = {};
  if (from) r.$gte = from;
  if (to) {
    const end = new Date(to);
    end.setUTCHours(23, 59, 59, 999);
    r.$lte = end;
  }
  return r;
}

export const pageMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { nameLower: 1, _id: 1 },
};
