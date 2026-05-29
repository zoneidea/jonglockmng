import { useMemo, useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { BookingDateSummary } from '../../components/BookingDateSummary.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatBookingDateSummary, formatDate, formatMoney, normalizeRows } from '../../utils/formatters.js';
import { DatePickerBare, filterRowsByKeyword, ReportActionButton, ReportExportActions, ReportFiltersBar, SearchInput } from '../../components/ManagementUi.jsx';

export function ReportsPage({ reportType }) {
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const marketRows = normalizeRows(markets);
  const [range, setRange] = useState(() => getCurrentMonthRange());
  const [keyword, setKeyword] = useState('');
  const isAvailableBoothReport = reportType === 'booths';
  const isDailySalesReport = reportType === 'daily';
  const isCustomerBookingsReport = reportType === 'person';
  const isProductTypesReport = reportType === 'product-types';
  const [marketId, setMarketId] = useState('');
  const [bookingStatus, setBookingStatus] = useState('active');
  const [userQuery, setUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const userPath = isCustomerBookingsReport ? `/mobile-users${userQuery.trim() ? `?keyword=${encodeURIComponent(userQuery.trim())}` : ''}` : null;
  const { data: users = [] } = useApi(userPath, { initialData: [], skip: !isCustomerBookingsReport });
  const path = useMemo(() => {
    const params = new URLSearchParams({ startDate: range.startDate, endDate: range.endDate });
    if (marketId) params.set('marketId', marketId);

    if (isAvailableBoothReport) return `/reports/available-booths?${params.toString()}`;
    if (isDailySalesReport) return `/reports/daily-sales?${params.toString()}`;
    if (isProductTypesReport) return `/accounting/product-types?${params.toString()}`;
    if (isCustomerBookingsReport) {
      if (!selectedUser?.id) return null;
      params.set('mobileUserId', selectedUser.id);
      params.set('limit', '500');
      return `/reports/customer-bookings?${params.toString()}`;
    }
    params.set('status', bookingStatus);
    return `/reports/bookings?${params.toString()}`;
  }, [bookingStatus, isAvailableBoothReport, isCustomerBookingsReport, isDailySalesReport, isProductTypesReport, marketId, range.endDate, range.startDate, selectedUser?.id]);
  const { data = [], loading, reload } = useApi(path, { initialData: [] });
  const userRows = normalizeRows(users);
  const reportRows = normalizeRows(data);
  const filteredReportRows = filterRowsByKeyword(reportRows, keyword);
  const summaryItems = buildReportSummary(filteredReportRows, reportType);

  const reportTitle = isAvailableBoothReport
    ? 'รายงานบูธว่าง'
    : isDailySalesReport
      ? 'รายงานการขายรายวัน'
      : isProductTypesReport
        ? 'รายงานประเภทสินค้าที่ขาย'
      : isCustomerBookingsReport
        ? 'การจองรายบุคคล'
        : 'รายงานการจอง';
  const reportDescription = isAvailableBoothReport
    ? 'แสดงเฉพาะ Booth ที่ว่างทุกวันตามช่วงวันที่เลือก'
    : isDailySalesReport
      ? 'รายการขายรายวันตามช่วงวันที่เลือก'
      : isProductTypesReport
        ? 'แสดงรายการขายแยกตามประเภทสินค้าที่ขายและวันที่ชำระเงิน'
      : isCustomerBookingsReport
        ? 'ค้นหาลูกค้าแล้วแสดงรายการจองเรียงจากใหม่ไปเก่า'
        : 'รายการจองที่ยังไม่สำเร็จทั้งหมดตามวันที่ทำรายการ';

  const exportColumns = isAvailableBoothReport
    ? ['ลำดับ', 'ตลาด', 'ช่วงวันที่', 'รหัส Booth', 'ชื่อ Booth', 'แผนผังบูธ', 'ประเภทสินค้า', 'ราคา', 'VAT', 'ราคารวม']
    : isProductTypesReport
      ? ['ลำดับที่', 'เลขที่ใบจอง', 'ประเภทสินค้าที่ขาย', 'ลูกค้า', 'วันที่ชำระเงิน', 'จำนวนเงินก่อน VAT']
    : isDailySalesReport || isCustomerBookingsReport
      ? ['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'Tell', 'ชื่อ Booth', 'สินค้าขาย', 'สถานะ', 'VAT', 'ยอดรวม', 'วันที่ขาย']
      : ['#', 'ตลาด', 'เลขจอง', 'ลูกค้า', 'วันที่ทำรายการ', 'วันที่จอง', 'Booth', 'จำนวนรายการ', 'สถานะ', 'แหล่งที่มา', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'ยอดรวม'];
  const exportRows = isAvailableBoothReport
    ? filteredReportRows.map((row, index) => [index + 1, row.market_name || '-', formatReportDateRange(row.booking_date, row.booking_end_date), row.booth_code || '-', row.booth_name || '-', row.floor_plan_name || '-', row.production_category_name || '-', formatMoney(row.price), formatMoney(row.vat_amount || 0), formatMoney(row.gross_price ?? row.price)])
    : isProductTypesReport
      ? filteredReportRows.map((row, index) => [index + 1, row.booking_public_id || '-', row.product_names || '-', row.customer_name || '-', formatDate(row.paid_date), formatMoney(row.amount_before_vat || 0)])
    : isDailySalesReport || isCustomerBookingsReport
      ? filteredReportRows.map((row, index) => [index + 1, row.booking_public_id || '-', row.market_name || '-', row.customer_name || '-', row.customer_phone || '-', row.booth_code || row.booth_name || '-', row.product_names || '-', row.booking_status || row.item_status || 'paid', formatMoney(row.vat_amount || 0), formatMoney(row.total_amount || 0), formatDate(row.booking_date)])
      : filteredReportRows.map((row, index) => [index + 1, row.market_name || '-', row.booking_public_id || '-', row.customer_name || '-', formatDate(row.created_at), formatBookingDateSummary(row.booking_dates || row.booking_date), row.booths || row.booth_code || row.booth_name || '-', Number(row.booking_count || 0), row.status || 'pending_payment', row.source || '-', formatMoney(row.subtotal_amount || 0), formatMoney(row.discount_amount || 0), formatMoney(row.vat_amount || 0), formatMoney(row.total_amount || 0)]);

  function selectCustomer(user) {
    setSelectedUser(user);
    setUserQuery([user.name, user.phone, user.email, user.public_id].filter(Boolean).join(' / '));
  }

  return (
    <>
      <PageHeader
        title={reportTitle}
        description={reportDescription}
        action={(
          isCustomerBookingsReport ? (
            <ReportFiltersBar>
              <SearchInput value={keyword} onChange={setKeyword} placeholder="ค้นหาชื่อลูกค้า เลขที่จอง ตลาด หรือ Booth" />
              <DatePickerBare value={range.startDate} onChange={(value) => setRange((current) => ({ ...current, startDate: value }))} className="sm:w-[190px]" />
              <DatePickerBare value={range.endDate} onChange={(value) => setRange((current) => ({ ...current, endDate: value }))} className="sm:w-[190px]" />
              <select value={marketId} onChange={(event) => setMarketId(event.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 sm:w-[220px]">
                <option value="">ทุกตลาด</option>
                {marketRows.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
              </select>
              <label className="relative block w-full xl:min-w-[360px]">
                <input
                  value={userQuery}
                  onChange={(event) => {
                    setUserQuery(event.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="พิมพ์ชื่อ เบอร์โทร อีเมล หรือรหัสผู้จอง"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />
                {userQuery.trim() && !selectedUser ? (
                  <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {userRows.length ? userRows.map((user) => (
                      <button key={user.id} type="button" onClick={() => selectCustomer(user)} className="block w-full px-4 py-3 text-left text-sm hover:bg-cyan-50">
                        <span className="block font-bold text-slate-800">{user.name || user.public_id}</span>
                        <span className="text-xs text-slate-500">{[user.phone, user.email, user.username].filter(Boolean).join(' / ')}</span>
                      </button>
                    )) : <div className="px-4 py-3 text-sm text-slate-500">ไม่พบผู้จอง</div>}
                  </div>
                ) : null}
              </label>
              <div className="flex flex-wrap gap-2">
                <ReportActionButton tone="slate" onClick={reload} disabled={!selectedUser?.id}>ค้นหา</ReportActionButton>
                <ReportExportActions title={reportTitle} columns={exportColumns} rows={exportRows} disabled={!exportRows.length} />
              </div>
            </ReportFiltersBar>
          ) : (
            <ReportFiltersBar>
              <div className="flex w-full flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <SearchInput value={keyword} onChange={setKeyword} placeholder="ค้นหาชื่อลูกค้า เลขที่จอง ตลาด หรือ Booth" />
                <DatePickerBare value={range.startDate} onChange={(value) => setRange((current) => ({ ...current, startDate: value }))} className="sm:w-[210px]" />
                <DatePickerBare value={range.endDate} onChange={(value) => setRange((current) => ({ ...current, endDate: value }))} className="sm:w-[210px]" />
                <select value={marketId} onChange={(event) => setMarketId(event.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 sm:w-[240px]">
                  <option value="">ทุกตลาด</option>
                  {marketRows.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
                </select>
                {!isAvailableBoothReport && !isDailySalesReport && !isProductTypesReport ? (
                  <select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 sm:w-[220px]">
                    <option value="active">ยังไม่สำเร็จ</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="all">ทั้งหมด</option>
                  </select>
                ) : null}
                <ReportActionButton tone="slate" onClick={reload}>ค้นหา</ReportActionButton>
              </div>
              <ReportExportActions title={reportTitle} columns={exportColumns} rows={exportRows} disabled={!exportRows.length} />
            </ReportFiltersBar>
          )
        )}
      />
      <Card>
        {loading ? <LoadingBlock /> : (
          <>
            <ReportSummary items={summaryItems} />
            {isAvailableBoothReport ? (
              <AvailableBoothReportTable rows={filteredReportRows} />
        ) : isProductTypesReport ? (
          <DataTable columns={['ลำดับที่', 'เลขที่ใบจอง', 'ประเภทสินค้าที่ขาย', 'ลูกค้า', 'วันที่ชำระเงิน', 'จำนวนเงินก่อน VAT']} rows={filteredReportRows.map((row, index) => [
            index + 1,
            row.booking_public_id || '-',
            row.product_names || '-',
            row.customer_name || '-',
            formatDate(row.paid_date),
            formatMoney(row.amount_before_vat || 0),
          ])} />
        ) : isDailySalesReport ? (
          <DailySalesReportTable rows={filteredReportRows} />
        ) : isCustomerBookingsReport ? (
          selectedUser ? <DailySalesReportTable rows={filteredReportRows} /> : <EmptyState title="กรุณาเลือกลูกค้า" description="พิมพ์ค้นหาแล้วเลือกจาก suggestion เพื่อดูรายการจอง" />
        ) : (
          <ReportTable rows={filteredReportRows} />
        )}
          </>
        )}
      </Card>
    </>
  );
}

function getCurrentMonthRange() {
  const now = new Date();
  const startDate = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
  const endDate = toDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return { startDate, endDate };
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sumRows(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function buildReportSummary(rows, reportType) {
  const countLabel = reportType === 'booths' ? 'จำนวนบูธว่าง' : 'จำนวนรายการ';
  const items = [{ label: countLabel, value: rows.length.toLocaleString('th-TH'), tone: 'cyan' }];

  if (reportType === 'booths') {
    items.push({ label: 'มูลค่าบูธว่าง', value: formatMoney(sumRows(rows, 'gross_price')), tone: 'emerald' });
    items.push({ label: 'VAT', value: formatMoney(sumRows(rows, 'vat_amount')), tone: 'amber' });
    return items;
  }

  if (reportType === 'product-types') {
    items.push({ label: 'ยอดก่อน VAT', value: formatMoney(sumRows(rows, 'amount_before_vat')), tone: 'emerald' });
    return items;
  }

  if (reportType === 'daily' || reportType === 'person') {
    items.push({ label: 'ยอดรวม', value: formatMoney(sumRows(rows, 'total_amount')), tone: 'emerald' });
    items.push({ label: 'VAT', value: formatMoney(sumRows(rows, 'vat_amount')), tone: 'amber' });
    return items;
  }

  items.push({ label: 'ยอดรวม', value: formatMoney(sumRows(rows, 'total_amount')), tone: 'emerald' });
  items.push({ label: 'ยอดก่อนส่วนลด', value: formatMoney(sumRows(rows, 'subtotal_amount')), tone: 'slate' });
  items.push({ label: 'VAT', value: formatMoney(sumRows(rows, 'vat_amount')), tone: 'amber' });
  return items;
}

function ReportSummary({ items }) {
  if (!items.length) return null;
  const tones = {
    cyan: 'bg-cyan-50 text-cyan-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">{item.label}</p>
          <p className={`mt-2 inline-flex rounded-xl px-3 py-1 text-lg font-extrabold ${tones[item.tone] || tones.slate}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function formatReportDateRange(startDate, endDate) {
  if (!endDate || startDate === endDate) return formatDate(startDate);
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function ReportTable({ rows }) {
  return <DataTable columns={['ลำดับ', 'ตลาด', 'เลขจอง', 'ลูกค้า', 'วันที่ทำรายการ', 'วันที่จอง', 'Booth', 'จำนวนรายการ', 'สถานะ', 'แหล่งที่มา', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'ยอดรวม']} rows={rows.map((row, index) => [index + 1, row.market_name, row.booking_public_id || '-', row.customer_name || '-', formatDate(row.created_at), <BookingDateSummary value={row.booking_dates || row.booking_date} />, row.booths || row.booth_code || row.booth_name || '-', Number(row.booking_count || 0), <StatusBadge value={row.status || 'pending_payment'} />, row.source || '-', formatMoney(row.subtotal_amount || row.booth_amount || 0), formatMoney(row.discount_amount || 0), formatMoney(row.vat_amount || 0), formatMoney(row.total_amount)])} />;
}

function AvailableBoothReportTable({ rows }) {
  return <DataTable columns={['ลำดับ', 'ตลาด', 'ช่วงวันที่', 'รหัส Booth', 'ชื่อ Booth', 'แผนผังบูธ', 'ประเภทสินค้า', 'ราคา', 'VAT', 'ราคารวม']} rows={rows.map((row, index) => [index + 1, row.market_name || '-', formatReportDateRange(row.booking_date, row.booking_end_date), row.booth_code || '-', row.booth_name || '-', row.floor_plan_name || '-', row.production_category_name || '-', formatMoney(row.price), formatMoney(row.vat_amount || 0), formatMoney(row.gross_price ?? row.price)])} />;
}

function DailySalesReportTable({ rows }) {
  return <DataTable columns={['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'Tell', 'ชื่อ Booth', 'สินค้าขาย', 'สถานะ', 'VAT', 'ยอดรวม', 'วันที่ขาย']} rows={rows.map((row, index) => [index + 1, row.booking_public_id || '-', row.market_name || '-', row.customer_name || '-', row.customer_phone || '-', row.booth_code || row.booth_name || '-', row.product_names || '-', <StatusBadge value={row.booking_status || row.item_status || 'paid'} />, formatMoney(row.vat_amount || 0), formatMoney(row.total_amount || 0), formatDate(row.booking_date)])} />;
}
