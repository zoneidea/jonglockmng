import {
  formatBookingDateSummary,
  formatBookingDateValue,
  parseBookingDateList,
} from '../utils/formatters.js';

export function BookingDateSummary({ value }) {
  const dates = parseBookingDateList(value);
  if (!dates.length) return '-';

  return (
    <div className="min-w-[170px]">
      <div className="font-bold text-slate-800">{formatBookingDateSummary(value)}</div>
      {dates.length > 1 ? (
        <div className="mt-1 text-xs text-slate-500">{dates.map(formatBookingDateValue).join(', ')}</div>
      ) : null}
    </div>
  );
}
