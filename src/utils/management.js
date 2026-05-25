export function toTimePickerValue(value) {
  const match = String(value || '').replace('.', ':').match(/(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function splitOpeningHours(value) {
  const [start = '', end = ''] = String(value || '').split('-');
  return { openingStart: toTimePickerValue(start), openingEnd: toTimePickerValue(end) };
}

export function combineOpeningHours(start, end) {
  if (!start && !end) return '';
  if (!end) return start;
  if (!start) return end;
  return `${start}-${end}`;
}

export function toDateTimePickerValue(value) {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
}

export function fromDateTimePickerValue(value) {
  if (!value) return '';
  const normalized = String(value).replace('T', ' ');
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

export function toDateInputValue(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dateKeyFromValue(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !value.includes('T')) return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce((current, part) => ({ ...current, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function dateKeyFromUtcTime(time) {
  const date = new Date(time);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function utcTimeFromDateKey(key) {
  const [year, month, day] = String(key || '').split('-').map(Number);
  if (!year || !month || !day) return Number.NaN;
  return Date.UTC(year, month - 1, day);
}

export function boothAvailabilityLabel(status) {
  const labels = {
    available: 'ว่าง',
    selected: 'กำลังเลือก',
    processing: 'กำลังดำเนินการ',
    booked: 'ถูกจองแล้ว',
  };
  return labels[status] || status || '-';
}
