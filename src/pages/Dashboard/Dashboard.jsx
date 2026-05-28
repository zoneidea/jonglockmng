import {
  BadgeCheck,
  BarChart3,
  CreditCard,
  Store,
  TicketCheck,
  Users,
  ClipboardCheck,
} from 'lucide-react';
import { useMemo } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../state/auth.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionTitle } from '../../components/SectionTitle.jsx';
import { Stat } from '../../components/Stat.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { normalizeRows, formatMoney } from '../../utils/formatters.js';

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthlyComparisonRange() {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    currentMonthStart,
    currentMonthEnd,
    previousMonthStart,
    previousMonthEnd,
    queryStart: toDateKey(previousMonthStart),
    queryEnd: toDateKey(currentMonthEnd),
  };
}

function monthName(date) {
  return new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(date);
}

function getPaymentDateKey(payment) {
  const value = payment.paid_at || payment.created_at;
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : toDateKey(date);
}

function buildMonthlyComparisonRows(payments, range) {
  const currentDays = range.currentMonthEnd.getDate();
  const previousDays = range.previousMonthEnd.getDate();
  const dayCount = Math.max(currentDays, previousDays);
  const currentPrefix = toDateKey(range.currentMonthStart).slice(0, 8);
  const previousPrefix = toDateKey(range.previousMonthStart).slice(0, 8);
  const currentByDay = new Map();
  const previousByDay = new Map();

  payments.forEach((payment) => {
    const key = getPaymentDateKey(payment);
    if (!key) return;
    const day = Number(key.slice(8, 10));
    const amount = Number(payment.total_amount ?? payment.amount ?? 0);
    if (key.startsWith(currentPrefix)) currentByDay.set(day, (currentByDay.get(day) || 0) + amount);
    if (key.startsWith(previousPrefix)) previousByDay.set(day, (previousByDay.get(day) || 0) + amount);
  });

  return Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    return {
      day,
      current: day <= currentDays ? currentByDay.get(day) || 0 : null,
      previous: day <= previousDays ? previousByDay.get(day) || 0 : null,
    };
  });
}

function MonthlyRevenueChart({ rows, currentLabel, previousLabel }) {
  const width = 960;
  const height = 300;
  const padding = { top: 24, right: 28, bottom: 42, left: 74 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = rows.flatMap((row) => [row.current, row.previous]).filter((value) => value !== null);
  const maxValue = Math.max(...values, 1);
  const x = (index) => padding.left + (rows.length <= 1 ? 0 : (index / (rows.length - 1)) * chartWidth);
  const y = (value) => padding.top + chartHeight - (Number(value || 0) / maxValue) * chartHeight;
  const points = (key) => rows
    .map((row, index) => (row[key] === null ? null : `${x(index)},${y(row[key])}`))
    .filter(Boolean)
    .join(' ');
  const currentTotal = rows.reduce((sum, row) => sum + Number(row.current || 0), 0);
  const previousTotal = rows.reduce((sum, row) => sum + Number(row.previous || 0), 0);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => maxValue * ratio);

  if (!values.some((value) => Number(value) > 0)) {
    return <EmptyState title="ยังไม่มียอดชำระเงิน" description="ไม่มีข้อมูลยอดชำระสำหรับเดือนนี้และเดือนก่อน" />;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
          <p className="text-xs font-semibold text-cyan-700">{currentLabel}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{formatMoney(currentTotal)}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-700">{previousLabel}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{formatMoney(previousTotal)}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-h-[260px] w-full min-w-[720px]" role="img" aria-label="กราฟเปรียบเทียบยอดเดือนปัจจุบันกับเดือนที่แล้ว">
          <defs>
            <linearGradient id="dashboard-current-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padding.left - 12} y={y(tick) + 4} textAnchor="end" className="fill-slate-400 text-[11px] font-semibold">
                {Math.round(tick).toLocaleString('th-TH')}
              </text>
            </g>
          ))}
          {rows.map((row, index) => (
            index % 5 === 0 || index === rows.length - 1 ? (
              <text key={row.day} x={x(index)} y={height - 14} textAnchor="middle" className="fill-slate-400 text-[11px] font-semibold">
                {row.day}
              </text>
            ) : null
          ))}
          <polyline fill="none" stroke="#f59e0b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" points={points('previous')} />
          <polyline fill="none" stroke="url(#dashboard-current-line)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" points={points('current')} />
          {rows.map((row, index) => row.current !== null ? <circle key={`current-${row.day}`} cx={x(index)} cy={y(row.current)} r="4" fill="#0891b2" /> : null)}
          {rows.map((row, index) => row.previous !== null ? <circle key={`previous-${row.day}`} cx={x(index)} cy={y(row.previous)} r="3.5" fill="#f59e0b" /> : null)}
        </svg>
      </div>
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-cyan-600" /> {currentLabel}</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> {previousLabel}</span>
      </div>
    </div>
  );
}

function buildMarketRevenueRows(payments, markets = []) {
  const marketMap = new Map();

  markets.forEach((market) => {
    const key = String(market.id ?? market.market_id ?? market.code ?? market.name ?? '');
    if (!key) return;
    marketMap.set(key, {
      key,
      name: market.name || market.market_name || market.code || `ตลาด ${key}`,
      amount: 0,
    });
  });

  payments.forEach((payment) => {
    const key = String(payment.market_id ?? payment.market_name ?? 'unknown');
    const name = payment.market_name || 'ไม่ระบุตลาด';
    const existing = marketMap.get(key) || { key, name, amount: 0 };
    existing.name = existing.name || name;
    existing.amount += Number(payment.total_amount ?? payment.amount ?? 0);
    marketMap.set(key, existing);
  });

  return Array.from(marketMap.values()).sort((first, second) => second.amount - first.amount || first.name.localeCompare(second.name, 'th'));
}

function MarketRevenueBarChart({ rows }) {
  const width = Math.max(760, rows.length * 96);
  const height = 320;
  const padding = { top: 24, right: 28, bottom: 82, left: 86 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...rows.map((row) => row.amount), 1);
  const barGap = 24;
  const barWidth = Math.max(34, (chartWidth - barGap * Math.max(rows.length - 1, 0)) / Math.max(rows.length, 1));
  const y = (value) => padding.top + chartHeight - (Number(value || 0) / maxValue) * chartHeight;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => maxValue * ratio);

  if (!rows.length || !rows.some((row) => Number(row.amount) > 0)) {
    return <EmptyState title="ยังไม่มียอดชำระเงินรายตลาด" description="เมื่อมีรายการชำระเงิน ระบบจะแสดงยอดเปรียบเทียบของแต่ละตลาดที่นี่" />;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">ตลาดที่มีข้อมูล</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{rows.length.toLocaleString('th-TH')}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 md:col-span-2">
          <p className="text-xs font-semibold text-emerald-700">ยอดรวมทุกตลาด</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{formatMoney(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0))}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-h-[280px] w-full min-w-[760px]" role="img" aria-label="กราฟแท่งเปรียบเทียบยอดตามตลาดทั้งหมดในองค์กร">
          <defs>
            <linearGradient id="dashboard-market-bars" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padding.left - 12} y={y(tick) + 4} textAnchor="end" className="fill-slate-400 text-[11px] font-semibold">
                {Math.round(tick).toLocaleString('th-TH')}
              </text>
            </g>
          ))}
          {rows.map((row, index) => {
            const x = padding.left + index * (barWidth + barGap);
            const barHeight = chartHeight - (y(row.amount) - padding.top);
            return (
              <g key={row.key}>
                <rect x={x} y={y(row.amount)} width={barWidth} height={barHeight} rx="10" fill="url(#dashboard-market-bars)" />
                <text x={x + barWidth / 2} y={y(row.amount) - 8} textAnchor="middle" className="fill-slate-700 text-[11px] font-black">
                  {formatMoney(row.amount).replace('฿', '')}
                </text>
                <text x={x + barWidth / 2} y={height - 48} textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">
                  {row.name.length > 16 ? `${row.name.slice(0, 16)}...` : row.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function Dashboard({ marketId, markets }) {
  const { user } = useAuth();
  const canReadReports = ['supervisor', 'admin', 'accounting'].includes(user?.role);
  const canReadPayments = ['supervisor', 'admin', 'accounting'].includes(user?.role);
  const chartRange = useMemo(getMonthlyComparisonRange, []);
  const { data: summary = {}, loading: summaryLoading } = useApi(canReadReports ? '/dashboard/summary' : null, { initialData: {}, skip: !canReadReports });
  const chartPath = canReadPayments
    ? `/accounting/payments?paidOnly=1&startDate=${chartRange.queryStart}&endDate=${chartRange.queryEnd}&dateField=payment_date${marketId ? `&marketId=${marketId}` : ''}`
    : null;
  const { data: chartPayments = [], loading: chartLoading } = useApi(chartPath, { initialData: [], skip: !canReadPayments });
  const { data: payments = [], loading: paymentsLoading } = useApi(canReadPayments ? '/accounting/payments?paidOnly=1' : null, { initialData: [], skip: !canReadPayments });
  const chartRows = useMemo(() => buildMonthlyComparisonRows(normalizeRows(chartPayments), chartRange), [chartPayments, chartRange]);
  const paymentRows = normalizeRows(payments);
  const marketRevenueRows = useMemo(() => buildMarketRevenueRows(paymentRows, normalizeRows(markets)), [paymentRows, markets]);
  const currentMonthLabel = monthName(chartRange.currentMonthStart);
  const previousMonthLabel = monthName(chartRange.previousMonthStart);
  const dashboardDescription = user?.role === 'admin'
    ? `ภาพรวมเฉพาะตลาดที่ได้รับมอบหมาย ${marketId ? `(เลือกตลาด ${marketId})` : ''}`
    : 'ภาพรวมรวมทุกตลาดภายในองค์กร';

  const summaryCards = [
    { label: 'ยอดชำระวันนี้', value: summaryLoading ? '...' : formatMoney(summary.paidToday ?? (Number(summary.bookingPaidToday || 0) + Number(summary.finePaidToday || 0))), icon: CreditCard, tone: 'emerald' },
    { label: 'ยอดชำระเดือนนี้', value: summaryLoading ? '...' : formatMoney(summary.paidThisMonth || 0), icon: BarChart3, tone: 'cyan' },
    { label: 'ยอดค้างชำระทั้งหมด', value: summaryLoading ? '...' : formatMoney(summary.outstandingTotal ?? (Number(summary.bookingOutstanding || 0) + Number(summary.fineOutstanding || 0))), icon: ClipboardCheck, tone: 'red' },
    { label: 'รายการรอตรวจสลิป', value: summaryLoading ? '...' : Number(summary.pendingPaymentProofs || 0), icon: TicketCheck, tone: 'amber' },
    { label: 'บูธเปิดจองทั้งหมด', value: summaryLoading ? '...' : Number(summary.totalBooths || 0), icon: Store, tone: 'slate' },
    { label: 'บูธถูกจองวันนี้', value: summaryLoading ? '...' : Number(summary.bookedBooths || 0), icon: TicketCheck, tone: 'blue' },
    { label: 'บูธว่างวันนี้', value: summaryLoading ? '...' : Number(summary.availableBooths || 0), icon: BadgeCheck, tone: 'emerald' },
    { label: 'ผู้ทำรายการวันนี้', value: summaryLoading ? '...' : Number(summary.dailyCustomers || 0), icon: Users, tone: 'amber' },
  ];

  return (
    <>
      <PageHeader title="ภาพรวมระบบ" description={dashboardDescription} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => <Stat key={item.label} label={item.label} value={item.value} icon={item.icon} tone={item.tone} />)}
      </div>
      <div className="mt-6 grid gap-6">
        <Card>
          <SectionTitle title="เปรียบเทียบยอดชำระรายวัน" description={`ยอดรวม ${previousMonthLabel} เทียบกับ ${currentMonthLabel}`} icon={BarChart3} />
          {chartLoading ? <LoadingBlock /> : <MonthlyRevenueChart rows={chartRows} currentLabel={currentMonthLabel} previousLabel={previousMonthLabel} />}
        </Card>
        <Card>
          <SectionTitle title="เปรียบเทียบยอดตามตลาด" description="ยอดชำระเงินรวมของตลาดทั้งหมดภายในองค์กร" icon={CreditCard} />
          {paymentsLoading ? <LoadingBlock /> : <MarketRevenueBarChart rows={marketRevenueRows} />}
        </Card>
      </div>
    </>
  );
}
