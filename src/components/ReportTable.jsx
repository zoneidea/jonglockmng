import { DataTable } from './DataTable.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import {
  formatMoney,
  formatDate,
  formatBookingDateSummary,
  formatBookingDateValue,
  parseBookingDateList,
} from '../utils/formatters.js';

function BookingDateSummary({ value }) {
  const dates = parseBookingDateList(value);
  if (!dates.length) return '-';
  return (
    <div className="min-w-[170px]">
      <div className="font-bold text-slate-800">{formatBookingDateSummary(value)}</div>
      {dates.length > 1 ? <div className="mt-1 text-xs text-slate-500">{dates.map(formatBookingDateValue).join(', ')}</div> : null}
    </div>
  );
}

export function ReportTable({ rows }) {
  return <DataTable columns={['ลำดับ', 'ตลาด', 'เลขจอง', 'ลูกค้า', 'วันที่ทำรายการ', 'วันที่จอง', 'Booth', 'จำนวนรายการ', 'สถานะ', 'แหล่งที่มา', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'ยอดรวม']} rows={rows.map((row, index) => [index + 1, row.market_name, row.booking_public_id || '-', row.customer_name || '-', formatDate(row.created_at), <BookingDateSummary value={row.booking_dates || row.booking_date} />, row.booths || row.booth_code || row.booth_name || '-', Number(row.booking_count || 0), <StatusBadge value={row.status || 'pending_payment'} />, row.source || '-', formatMoney(row.subtotal_amount || row.booth_amount || 0), formatMoney(row.discount_amount || 0), formatMoney(row.vat_amount || 0), formatMoney(row.total_amount)])} />;
}
