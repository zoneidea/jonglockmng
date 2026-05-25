import { useState } from 'react';
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
  const [range, setRange] = useState({ startDate: '2026-05-01', endDate: '2026-05-31' });
  const [keyword, setKeyword] = useState('');
  const isAvailableBoothReport = reportType === 'booths';
  const isDailySalesReport = reportType === 'daily';
  const isCustomerBookingsReport = reportType === 'person';
  const isProductTypesReport = reportType === 'product-types';
  const [marketId, setMarketId] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const userPath = isCustomerBookingsReport ? `/mobile-users${userQuery.trim() ? `?keyword=${encodeURIComponent(userQuery.trim())}` : ''}` : null;
  const { data: users = [] } = useApi(userPath, { initialData: [], skip: !isCustomerBookingsReport });
  const path = isAvailableBoothReport
    ? `/reports/available-booths?bookingDate=${range.startDate}`
    : isDailySalesReport
      ? `/reports/daily-sales?startDate=${range.startDate}&endDate=${range.endDate}`
      : isProductTypesReport
        ? `/accounting/product-types?startDate=${range.startDate}&endDate=${range.endDate}${marketId ? `&marketId=${marketId}` : ''}`
      : isCustomerBookingsReport
        ? selectedUser?.id ? `/reports/customer-bookings?mobileUserId=${selectedUser.id}` : null
        : `/reports/bookings?startDate=${range.startDate}&endDate=${range.endDate}`;
  const { data = [], loading, reload } = useApi(path, { initialData: [] });
  const userRows = normalizeRows(users);
  const reportRows = normalizeRows(data);
  const filteredReportRows = filterRowsByKeyword(reportRows, keyword);

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
    ? 'แสดงเฉพาะ Booth ที่ว่างตามวันที่เลือก'
    : isDailySalesReport
      ? 'รายการขายรายวันตามช่วงวันที่เลือก'
      : isProductTypesReport
        ? 'แสดงรายการขายแยกตามประเภทสินค้าที่ขายและวันที่ชำระเงิน'
      : isCustomerBookingsReport
        ? 'ค้นหาลูกค้าแล้วแสดงรายการจองเรียงจากใหม่ไปเก่า'
        : 'รายการจองที่ยังไม่สำเร็จทั้งหมดตามวันที่ทำรายการ';

  const exportColumns = isAvailableBoothReport
    ? ['ลำดับ', 'ตลาด', 'วันที่', 'รหัส Booth', 'ชื่อ Booth', 'แผนผังบูธ', 'ประเภทสินค้า', 'ราคา', 'VAT', 'ราคารวม']
    : isProductTypesReport
      ? ['ลำดับที่', 'เลขที่ใบจอง', 'ประเภทสินค้าที่ขาย', 'ลูกค้า', 'วันที่ชำระเงิน', 'จำนวนเงินก่อน VAT']
    : isDailySalesReport || isCustomerBookingsReport
      ? ['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'Tell', 'ชื่อ Booth', 'สินค้าขาย', 'VAT', 'ยอดรวม', 'วันที่ขาย']
      : ['#', 'ตลาด', 'เลขจอง', 'ลูกค้า', 'วันที่ทำรายการ', 'วันที่จอง', 'Booth', 'จำนวนรายการ', 'สถานะ', 'แหล่งที่มา', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'ยอดรวม'];
  const exportRows = isAvailableBoothReport
    ? filteredReportRows.map((row, index) => [index + 1, row.market_name || '-', formatDate(row.booking_date), row.booth_code || '-', row.booth_name || '-', row.floor_plan_name || '-', row.production_category_name || '-', formatMoney(row.price), formatMoney(row.vat_amount || 0), formatMoney(row.gross_price ?? row.price)])
    : isProductTypesReport
      ? filteredReportRows.map((row, index) => [index + 1, row.booking_public_id || '-', row.product_names || '-', row.customer_name || '-', formatDate(row.paid_date), formatMoney(row.amount_before_vat || 0)])
    : isDailySalesReport || isCustomerBookingsReport
      ? filteredReportRows.map((row, index) => [index + 1, row.booking_public_id || '-', row.market_name || '-', row.customer_name || '-', row.customer_phone || '-', row.booth_code || row.booth_name || '-', row.product_names || '-', formatMoney(row.vat_amount || 0), formatMoney(row.total_amount || 0), formatDate(row.booking_date)])
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
                <ReportExportActions title={reportTitle} columns={exportColumns} rows={exportRows} disabled={!exportRows.length} />
              </div>
            </ReportFiltersBar>
          ) : (
            <ReportFiltersBar>
              <div className="flex w-full flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <SearchInput value={keyword} onChange={setKeyword} placeholder="ค้นหาชื่อลูกค้า เลขที่จอง ตลาด หรือ Booth" />
                <DatePickerBare value={range.startDate} onChange={(value) => setRange((current) => ({ ...current, startDate: value }))} className="sm:w-[210px]" />
                {!isAvailableBoothReport ? <DatePickerBare value={range.endDate} onChange={(value) => setRange((current) => ({ ...current, endDate: value }))} className="sm:w-[210px]" /> : null}
                {isProductTypesReport ? (
                  <select value={marketId} onChange={(event) => setMarketId(event.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 sm:w-[240px]">
                    <option value="">ทุกตลาด</option>
                    {marketRows.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
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
        {loading ? <LoadingBlock /> : isAvailableBoothReport ? (
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
      </Card>
    </>
  );
}

function ReportTable({ rows }) {
  return <DataTable columns={['ลำดับ', 'ตลาด', 'เลขจอง', 'ลูกค้า', 'วันที่ทำรายการ', 'วันที่จอง', 'Booth', 'จำนวนรายการ', 'สถานะ', 'แหล่งที่มา', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'ยอดรวม']} rows={rows.map((row, index) => [index + 1, row.market_name, row.booking_public_id || '-', row.customer_name || '-', formatDate(row.created_at), <BookingDateSummary value={row.booking_dates || row.booking_date} />, row.booths || row.booth_code || row.booth_name || '-', Number(row.booking_count || 0), <StatusBadge value={row.status || 'pending_payment'} />, row.source || '-', formatMoney(row.subtotal_amount || row.booth_amount || 0), formatMoney(row.discount_amount || 0), formatMoney(row.vat_amount || 0), formatMoney(row.total_amount)])} />;
}

function AvailableBoothReportTable({ rows }) {
  return <DataTable columns={['ลำดับ', 'ตลาด', 'วันที่', 'รหัส Booth', 'ชื่อ Booth', 'แผนผังบูธ', 'ประเภทสินค้า', 'ราคา', 'VAT', 'ราคารวม']} rows={rows.map((row, index) => [index + 1, row.market_name || '-', formatDate(row.booking_date), row.booth_code || '-', row.booth_name || '-', row.floor_plan_name || '-', row.production_category_name || '-', formatMoney(row.price), formatMoney(row.vat_amount || 0), formatMoney(row.gross_price ?? row.price)])} />;
}

function DailySalesReportTable({ rows }) {
  return <DataTable columns={['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'Tell', 'ชื่อ Booth', 'สินค้าขาย', 'VAT', 'ยอดรวม', 'วันที่ขาย']} rows={rows.map((row, index) => [index + 1, row.booking_public_id || '-', row.market_name || '-', row.customer_name || '-', row.customer_phone || '-', row.booth_code || row.booth_name || '-', row.product_names || '-', formatMoney(row.vat_amount || 0), formatMoney(row.total_amount || 0), formatDate(row.booking_date)])} />;
}
