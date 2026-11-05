import {useState} from 'react';
import {Card} from '../../components/Card.jsx';
import {BookingDateSummary} from '../../components/BookingDateSummary.jsx';
import {DataTable} from '../../components/DataTable.jsx';
import {LoadingBlock} from '../../components/LoadingBlock.jsx';
import {PageHeader} from '../../components/PageHeader.jsx';
import {StatusBadge} from '../../components/StatusBadge.jsx';
import {DatePickerBare, ReportActionButton, ReportExportActions, SearchInput, SmallButton, filterRowsByKeyword} from '../../components/ManagementUi.jsx';
import {useApi, useMutation} from '../../hooks/useApi.js';
import {formatBookingDateSummary, formatDate, formatMoney, normalizeRows} from '../../utils/formatters.js';
import {paymentChannelLabel, paymentChannelOptions, providerLabel} from '../../utils/paymentChannels.js';
import PaymentChannelSummary from './PaymentChannelSummary.jsx';

function currentMonthRange() {
  const now = new Date();
  const date = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return {startDate: date(new Date(now.getFullYear(),now.getMonth(),1)), endDate: date(new Date(now.getFullYear(),now.getMonth()+1,0))};
}

export default function AccountingPage({ paidOnly = false, onPrintDocument }) {
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const marketRows = normalizeRows(markets);
  const [filters, setFilters] = useState({
    ...currentMonthRange(),
    paymentChannel: '',
    marketId: '',
    dateField: 'payment_date',
    sortBy: 'payment_date',
    keyword: '',
  });
  const queryString = new URLSearchParams({
    ...(paidOnly ? { paidOnly: '1' } : {}),
    startDate: filters.startDate,
    endDate: filters.endDate,
    dateField: filters.dateField,
    sortBy: filters.sortBy,
    ...(filters.marketId ? { marketId: filters.marketId } : {}),
    ...(filters.paymentChannel ? { paymentChannel: filters.paymentChannel } : {}),
  }).toString();
  const { data = [], loading, reload } = useApi(`/accounting/payments?${queryString}`, { initialData: [] });
  const { mutate: mutateDocument, loading: issuingDocument } = useMutation();
  const rows = normalizeRows(data);
  const filteredRows = filterRowsByKeyword(rows, filters.keyword);
  const exportColumns = paidOnly
    ? ['เลขชำระเงิน', 'ประเภทการชำระเงิน', 'ผู้ให้บริการ', 'ช่องทางชำระ', 'เลขอ้างอิง gateway', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน']
    : ['เลขชำระเงิน', 'ประเภทการชำระเงิน', 'ผู้ให้บริการ', 'ช่องทางชำระ', 'เลขอ้างอิง gateway', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'สถานะ', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน'];
  const exportRows = filteredRows.map((payment) => {
    const baseRow = [payment.public_id, payment.payment_kind === 'audit_fine' ? 'ค่าปรับ' : 'ค่าบริการ', providerLabel(payment.provider), paymentChannelLabel(payment), payment.provider_reference || '-', payment.booking_public_id || '-', payment.market_name || '-', formatBookingDateSummary(payment.booking_dates), payment.booths || '-', payment.customer_name || '-'];
    const amountRow = [formatMoney(payment.subtotal_amount || 0), formatMoney(payment.discount_amount || 0), formatMoney(payment.vat_amount || 0), formatMoney(payment.amount), formatDate(payment.paid_at || payment.created_at)];
    return paidOnly ? [...baseRow, ...amountRow] : [...baseRow, payment.status || '-', ...amountRow];
  });

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function issueAndPrintPaymentDocument(payment) {
    const payload = await mutateDocument(`/accounting/payments/${payment.id}/document`, {}, 'POST');
    onPrintDocument(payload);
    reload();
  }

  return (
    <>
      <PageHeader
        title={paidOnly ? 'รายงานการชำระเงิน' : 'บัญชี'}
        description={paidOnly ? 'แสดงรายการที่ชำระเงินแล้วทั้งหมดตามช่วงวันที่และตลาด' : 'รายการชำระเงินทั้งหมด'}
        action={(
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-soft xl:min-w-[720px]">
            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex w-full flex-col gap-3 sm:flex-row xl:justify-end">
                <SearchInput value={filters.keyword} onChange={(value) => setFilter('keyword', value)} placeholder="ค้นหาลูกค้า เลขจอง เลขชำระเงิน หรือตลาด" />
                <DatePickerBare value={filters.startDate} onChange={(value) => setFilter('startDate', value)} className="sm:w-[210px]" />
                <DatePickerBare value={filters.endDate} onChange={(value) => setFilter('endDate', value)} className="sm:w-[210px]" />
                <ReportActionButton tone="slate" onClick={reload}>ค้นหา</ReportActionButton>
              </div>
              <ReportExportActions title={paidOnly ? 'รายงานการชำระเงิน' : 'รายการชำระเงินทั้งหมด'} columns={exportColumns} rows={exportRows} disabled={!exportRows.length} />
            </div>
          </div>
        )}
      />
      <PaymentChannelSummary payments={filteredRows} />
      <Card>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <select aria-label="ช่องทางชำระเงิน" value={filters.paymentChannel} onChange={(event) => setFilter('paymentChannel', event.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm">
                <option value="">ทุกช่องทางชำระเงิน</option>
                {paymentChannelOptions(rows).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
              <select value={filters.marketId} onChange={(event) => setFilter('marketId', event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
                <option value="">ทุกตลาด</option>
                {marketRows.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
              </select>
              <select value={filters.dateField} onChange={(event) => setFilter('dateField', event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
                <option value="payment_date">ค้นหาด้วยวันที่ชำระเงิน</option>
                <option value="booking_date">ค้นหาด้วยวันที่จัดงาน</option>
                <option value="created_date">ค้นหาด้วยวันที่ทำรายการ</option>
              </select>
              <select value={filters.sortBy} onChange={(event) => setFilter('sortBy', event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
                <option value="payment_date">เรียงตามวันที่ชำระเงิน</option>
                <option value="booking_public_id">เรียงตามเลขที่ใบจอง</option>
                <option value="booking_date">เรียงตามวันที่จัดงาน</option>
              </select>
            </div>
          </div>
          {loading ? <LoadingBlock /> : <DataTable columns={paidOnly ? ['เลขชำระเงิน', 'ประเภทการชำระเงิน', 'ผู้ให้บริการ', 'ช่องทางชำระ', 'เลขอ้างอิง gateway', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน', 'จัดการ'] : ['เลขชำระเงิน', 'ประเภทการชำระเงิน', 'ผู้ให้บริการ', 'ช่องทางชำระ', 'เลขอ้างอิง gateway', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'สถานะ', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน', 'จัดการ']} rows={filteredRows.map((payment) => {
            const baseRow = [
              payment.public_id,
              payment.payment_kind === 'audit_fine' ? 'ค่าปรับ' : 'ค่าบริการ', providerLabel(payment.provider), paymentChannelLabel(payment), payment.provider_reference || '-',
              payment.booking_public_id || '-',
              payment.market_name || '-',
              <BookingDateSummary value={payment.booking_dates} />,
              payment.booths || '-',
              payment.customer_name || '-',
            ];
            const amountRow = [
              formatMoney(payment.subtotal_amount || 0),
              formatMoney(payment.discount_amount || 0),
              formatMoney(payment.vat_amount || 0),
              formatMoney(payment.amount),
              formatDate(payment.paid_at || payment.created_at),
              <SmallButton tone={Number(payment.vat_enabled || 0) === 1 ? 'cyan' : 'amber'} onClick={() => issueAndPrintPaymentDocument(payment)} disabled={issuingDocument}>
                {payment.document_no || (Number(payment.vat_enabled || 0) === 1 ? 'ใบกำกับภาษี' : 'ใบเสร็จ')}
              </SmallButton>,
            ];
            return paidOnly ? [...baseRow, ...amountRow] : [...baseRow, <StatusBadge value={payment.status} />, ...amountRow];
          })} />}
        </div>
      </Card>
    </>
  );
}
