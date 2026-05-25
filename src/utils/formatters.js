export function formatMoney(value) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' }).format(new Date(value));
}

export function normalizeRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

export function reportFileName(title, extension) {
  const date = new Date().toISOString().slice(0, 10);
  const safeTitle = String(title || 'report').replace(/[^\w\u0E00-\u0E7F-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'report';
  return `${safeTitle}-${date}.${extension}`;
}

export function escapeHtml(value) {
  if (!value) return '';
  const tempEl = document.createElement('div');
  tempEl.textContent = value;
  return tempEl.innerHTML;
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function parseBookingDateList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((date) => date.trim())
    .filter(Boolean)
    .sort();
}

export function formatBookingDateValue(value) {
  if (!value) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return formatDate(`${value}T00:00:00+07:00`);
  }
  return formatDate(value);
}

export function formatBookingDateSummary(value) {
  const dates = parseBookingDateList(value);
  if (!dates.length) return '-';
  if (dates.length === 1) return formatBookingDateValue(dates[0]);
  const firstDate = formatBookingDateValue(dates[0]);
  const lastDate = formatBookingDateValue(dates[dates.length - 1]);
  return `${firstDate} - ${lastDate} (${dates.length} วัน)`;
}
