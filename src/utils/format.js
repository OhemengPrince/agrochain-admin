export function extractArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw?.content && Array.isArray(raw.content)) return raw.content;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.items && Array.isArray(raw.items)) return raw.items;
  return [];
}

export function formatGHS(amount, { decimals = 2 } = {}) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: decimals,
  }).format(amount || 0);
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

export function itemDate(item) {
  return item?.date || item?.createdAt || null;
}
