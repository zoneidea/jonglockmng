export const OPEN_DAY_OPTIONS = [
  ['sun', 'อาทิตย์'],
  ['mon', 'จันทร์'],
  ['tue', 'อังคาร'],
  ['wed', 'พุธ'],
  ['thu', 'พฤหัสบดี'],
  ['fri', 'ศุกร์'],
  ['sat', 'เสาร์'],
];

export const DEFAULT_OPEN_DAYS = OPEN_DAY_OPTIONS.map(([value]) => value);

export function normalizeOpenDays(value) {
  if (Array.isArray(value)) return value.filter((item) => DEFAULT_OPEN_DAYS.includes(String(item)));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeOpenDays(parsed);
    } catch {}
  }
  return DEFAULT_OPEN_DAYS;
}

export function OpenDaysCheckboxGroup({ value = [], onChange }) {
  const selected = value.length ? value : DEFAULT_OPEN_DAYS;
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {OPEN_DAY_OPTIONS.map(([day, label]) => (
        <label key={day} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={selected.includes(day)}
            onChange={(event) => {
              const next = event.target.checked
                ? [...new Set([...selected, day])]
                : selected.filter((item) => item !== day);
              onChange(next.length ? next : DEFAULT_OPEN_DAYS);
            }}
            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

