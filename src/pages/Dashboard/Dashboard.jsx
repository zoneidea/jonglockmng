import {
  BadgeCheck,
  BarChart3,
  CreditCard,
  Store,
  TicketCheck,
  Users,
  ClipboardCheck,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../state/auth.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionTitle } from '../../components/SectionTitle.jsx';
import { Stat } from '../../components/Stat.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ReportTable } from '../../components/ReportTable.jsx';
import { normalizeRows, formatMoney, formatDate } from '../../utils/formatters.js';

export function Dashboard({ marketId, markets }) {
  const { user } = useAuth();
  const canReadReports = ['supervisor', 'admin', 'accounting'].includes(user?.role);
  const canReadPayments = ['supervisor', 'admin', 'accounting'].includes(user?.role);
  const { data: summary = {}, loading: summaryLoading } = useApi(canReadReports ? '/dashboard/summary' : null, { initialData: {}, skip: !canReadReports });
  const { data: report = [], loading: reportLoading } = useApi(canReadReports ? '/reports/bookings' : null, { initialData: [], skip: !canReadReports });
  const { data: payments = [] } = useApi(canReadPayments ? '/accounting/payments?paidOnly=1' : null, { initialData: [], skip: !canReadPayments });
  const reportRows = normalizeRows(report);
  const paymentRows = normalizeRows(payments);
  const dashboardDescription = user?.role === 'admin'
    ? `ภาพรวมเฉพาะตลาดที่ได้รับมอบหมาย ${marketId ? `(เลือกตลาด ${marketId})` : ''}`
    : 'ภาพรวมรวมทุกตลาดภายในองค์กร';

  const summaryCards = [
    { label: 'บูธที่เปิดจองทั้งหมด', value: summaryLoading ? '...' : Number(summary.totalBooths || 0), icon: Store, tone: 'slate' },
    { label: 'บูธที่จองแล้ว', value: summaryLoading ? '...' : Number(summary.bookedBooths || 0), icon: TicketCheck, tone: 'blue' },
    { label: 'บูธที่ยังว่างอยู่', value: summaryLoading ? '...' : Number(summary.availableBooths || 0), icon: BadgeCheck, tone: 'emerald' },
    { label: 'ยอดคนที่เข้ามาทำรายการทั้งหมด (วันปัจจุบัน)', value: summaryLoading ? '...' : Number(summary.dailyCustomers || 0), icon: Users, tone: 'amber' },
    { label: 'ยอดชำระการจอง (วันปัจจุบัน)', value: summaryLoading ? '...' : formatMoney(summary.bookingPaidToday || 0), icon: CreditCard, tone: 'emerald' },
    { label: 'ยอดชำระค่าปรับ (วันปัจจุบัน)', value: summaryLoading ? '...' : formatMoney(summary.finePaidToday || 0), icon: CreditCard, tone: 'cyan' },
    { label: 'ยอดค้างชำระค่าจอง (ทั้งหมด)', value: summaryLoading ? '...' : formatMoney(summary.bookingOutstanding || 0), icon: BarChart3, tone: 'red' },
    { label: 'ยอดค้างชำระค่าปรับ (ทั้งหมด)', value: summaryLoading ? '...' : formatMoney(summary.fineOutstanding || 0), icon: ClipboardCheck, tone: 'red' },
  ];

  return (
    <>
      <PageHeader title="ภาพรวมระบบ" description={dashboardDescription} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => <Stat key={item.label} label={item.label} value={item.value} icon={item.icon} tone={item.tone} />)}
      </div>
      <div className="mt-6 grid gap-6">
        <Card>
          <SectionTitle title="รายการจองยังไม่สำเร็จ" description="รายการ pending, processing และ expired ตามวันที่จอง" icon={BarChart3} />
          {reportLoading ? <LoadingBlock /> : <ReportTable rows={reportRows} />}
        </Card>
        <Card>
          <SectionTitle title="รายการชำระเงินล่าสุด" description="แสดงรายการล่าสุดจากระบบบัญชี" icon={CreditCard} />
          {paymentRows.length ? (
            <DataTable
              columns={['เลขชำระเงิน', 'เลขจอง', 'วันที่จอง', 'Booth', 'Provider', 'สถานะ', 'VAT', 'จำนวนเงิน', 'วันที่ชำระ/ทำรายการ']}
              rows={paymentRows.slice(0, 10).map((payment) => [
                payment.public_id,
                payment.booking_public_id || '-',
                payment.booking_dates || '-',
                payment.booths || '-',
                payment.provider,
                <StatusBadge value={payment.status} />,
                formatMoney(payment.vat_amount || 0),
                formatMoney(payment.amount),
                formatDate(payment.paid_at || payment.created_at),
              ])}
            />
          ) : <EmptyState title="ไม่พบข้อมูลการชำระเงิน" description="ยังไม่มีรายการชำระเงินล่าสุดในช่วงนี้" />}
        </Card>
      </div>
    </>
  );
}
