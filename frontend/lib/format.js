const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const formatDate = (d) => (d ? dateFmt.format(new Date(d)) : '-');
export const initials = (name = '') =>
  name
    .replace(/^dr\.?\s+/i, '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
export const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
