import { useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  Factory,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  Plus,
  Search,
  ShieldCheck,
  Store,
  TicketCheck,
  Users,
  X,
} from 'lucide-react';
import { API_BASE_URL } from './api/client.js';
import { useApi, useMutation } from './hooks/useApi.js';
import { useAuth } from './state/auth.jsx';

const menu = [
  { path: '/', label: 'ภาพรวม', icon: LayoutDashboard, menuKey: 'dashboard', roles: ['supervisor', 'admin', 'accounting'] },
  { path: '/markets', label: 'จัดการตลาด', icon: Store, menuKey: 'markets' },
  { path: '/products', label: 'สินค้า', icon: Package, menuKey: 'products' },
  { path: '/coupons', label: 'โค้ดส่วนลด', icon: Percent, menuKey: 'coupons' },
  { path: '/bookings', label: 'การจอง', icon: CalendarCheck, menuKey: 'bookings' },
  { path: '/reports', label: 'Report', icon: BarChart3, menuKey: 'reports' },
  { path: '/audit', label: 'ตรวจสอบตลาด', icon: ClipboardCheck, menuKey: 'market_audit' },
  { path: '/accounting', label: 'บัญชี', icon: CreditCard, menuKey: 'accounting' },
  { path: '/admins', label: 'ผู้ดูแลระบบ', icon: Users, menuKey: 'admins' },
];

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatMoney(value) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' }).format(new Date(value));
}

function StatusBadge({ value }) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    pending_payment: 'bg-amber-50 text-amber-700 ring-amber-200',
    payment_processing: 'bg-blue-50 text-blue-700 ring-blue-200',
    failed: 'bg-red-50 text-red-700 ring-red-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
    inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return (
    <span className={classNames('inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1', styles[value] || 'bg-slate-100 text-slate-700 ring-slate-200')}>
      {value || '-'}
    </span>
  );
}

function EmptyState({ title = 'ไม่พบข้อมูล', description = 'ยังไม่มีรายการสำหรับเงื่อนไขนี้' }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded border border-dashed border-slate-300 bg-white px-4 text-center">
      <Factory className="mb-3 h-8 w-8 text-slate-400" />
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-14 animate-pulse rounded bg-slate-100" />
      ))}
    </div>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: 'admin', password: 'Admin@123456' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative flex flex-col justify-between overflow-hidden px-8 py-8 sm:px-12 lg:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_32%),radial-gradient(circle_at_72%_40%,rgba(59,130,246,0.20),transparent_30%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-400 text-slate-950">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">Jonglock Management</span>
            </div>
          </div>
          <div className="relative max-w-2xl py-14">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.24em] text-emerald-200">Market Operations</p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">ระบบจัดการตลาดและพื้นที่ขาย</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              จัดการตลาด บูธ สินค้า โค้ดส่วนลด การจอง การชำระเงิน และรายงานในหน้าจอเดียว พร้อมสิทธิ์การใช้งานแยกตามบทบาท
            </p>
          </div>
          <div className="relative grid max-w-2xl gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded border border-white/10 bg-white/5 p-4">Multi organization</div>
            <div className="rounded border border-white/10 bg-white/5 p-4">Role based access</div>
            <div className="rounded border border-white/10 bg-white/5 p-4">API connected</div>
          </div>
        </section>
        <section className="flex items-center justify-center bg-slate-50 px-5 py-10 text-slate-950">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded bg-white p-8 shadow-soft">
            <div className="mb-8">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded bg-slate-950 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold">เข้าสู่ระบบจัดการ</h2>
              <p className="mt-2 text-sm text-slate-500">ใช้บัญชี supervisor, admin หรือ accounting</p>
            </div>
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                className="h-11 w-full rounded border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                autoComplete="username"
              />
            </label>
            <label className="mb-5 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <input
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="h-11 w-full rounded border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                type="password"
                autoComplete="current-password"
              />
            </label>
            {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            <button
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
            <p className="mt-5 text-xs text-slate-500">API: {API_BASE_URL}</p>
          </form>
        </section>
      </div>
    </main>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Shell() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const canLoadMarkets = ['supervisor', 'admin'].includes(user?.role);
  const { data: markets = [], loading: marketsLoading, reload: reloadMarkets } = useApi(canLoadMarkets ? '/management/markets' : null, {
    initialData: [],
    skip: !canLoadMarkets,
  });
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const currentMarketId = selectedMarketId || markets?.[0]?.id || '';

  const availableMenu = useMemo(() => {
    const allowed = new Set([...(user?.menus || []), 'dashboard']);
    return menu.filter((item) => allowed.has(item.menuKey) || item.roles?.includes(user?.role));
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-950 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Jonglock</p>
              <p className="text-xs text-slate-500">Management</p>
            </div>
          </div>
          <button className="rounded p-2 text-slate-500 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 py-4">
          {availableMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  classNames(
                    'mb-1 flex h-10 items-center gap-3 rounded px-3 text-sm font-medium transition',
                    isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <button className="rounded p-2 text-slate-600 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">ระบบจัดการตลาด</p>
              <p className="truncate text-xs text-slate-500">Role: {user?.role || '-'}</p>
            </div>
            <select
              value={currentMarketId}
              onChange={(event) => setSelectedMarketId(event.target.value)}
              className="hidden h-10 min-w-52 rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950 sm:block"
            >
              {marketsLoading ? <option>Loading...</option> : null}
              {(markets || []).map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
            </select>
            <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-sm font-medium hover:bg-slate-50">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">
          <Routes>
            <Route path="/" element={<Dashboard marketId={currentMarketId} markets={markets || []} />} />
            <Route path="/markets" element={<MarketsPage markets={markets || []} reloadMarkets={reloadMarkets} />} />
            <Route path="/products" element={<ProductsPage marketId={currentMarketId} />} />
            <Route path="/coupons" element={<CouponsPage marketId={currentMarketId} />} />
            <Route path="/bookings" element={<BookingsPage marketId={currentMarketId} />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit" element={<AuditPage marketId={currentMarketId} />} />
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/admins" element={<AdminsPage marketId={currentMarketId} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-950 text-white',
    emerald: 'bg-emerald-600 text-white',
    blue: 'bg-blue-600 text-white',
    amber: 'bg-amber-500 text-slate-950',
  };
  return (
    <div className="rounded bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={classNames('flex h-10 w-10 items-center justify-center rounded', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Dashboard({ marketId, markets }) {
  const { user } = useAuth();
  const canReadReports = ['supervisor', 'admin'].includes(user?.role);
  const canReadPayments = ['supervisor', 'accounting'].includes(user?.role);
  const { data: report = [], loading: reportLoading } = useApi(canReadReports ? '/management/reports/bookings' : null, {
    initialData: [],
    skip: !canReadReports,
  });
  const { data: payments = [] } = useApi(canReadPayments ? '/management/accounting/payments' : null, {
    initialData: [],
    skip: !canReadPayments,
  });
  const marketCount = markets.length;
  const bookingCount = (report || []).reduce((sum, row) => sum + Number(row.booking_count || 0), 0);
  const revenue = (report || []).reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const paidPayments = (payments || []).filter((payment) => payment.status === 'paid').length;

  return (
    <>
      <PageHeader title="ภาพรวมการดำเนินงาน" description="สรุปสถานะตลาด การจอง รายรับ และการชำระเงินจาก API ล่าสุด" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="ตลาดที่ดูแล" value={marketCount} icon={Store} tone="slate" />
        <Stat label="จำนวนการจอง" value={bookingCount} icon={TicketCheck} tone="blue" />
        <Stat label="ยอดรวมการจอง" value={formatMoney(revenue)} icon={BarChart3} tone="emerald" />
        <Stat label="รายการชำระแล้ว" value={paidPayments} icon={BadgeCheck} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">สถานะการจอง</h2>
            <span className="text-xs text-slate-500">Market ID: {marketId || '-'}</span>
          </div>
          {reportLoading ? <LoadingBlock /> : <ReportTable rows={report || []} />}
        </section>
        <section className="rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">รายการชำระเงินล่าสุด</h2>
          <PaymentList rows={(payments || []).slice(0, 8)} />
        </section>
      </div>
    </>
  );
}

function MarketsPage({ markets, reloadMarkets }) {
  const { mutate, loading, error } = useMutation();
  const [form, setForm] = useState({ code: '', name: '', description: '', openDate: '', closeDate: '' });

  async function submit(event) {
    event.preventDefault();
    await mutate('/management/markets', { ...form, closeDate: form.closeDate || null, openDate: form.openDate || null });
    setForm({ code: '', name: '', description: '', openDate: '', closeDate: '' });
    reloadMarkets();
  }

  return (
    <>
      <PageHeader title="จัดการตลาด" description="รายชื่อตลาดและการสร้างตลาดใหม่สำหรับ organization ของผู้ใช้" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded bg-white p-5 shadow-sm">
          <DataTable
            columns={['Code', 'ชื่อตลาด', 'สถานะ', 'วันเปิด', 'วันปิด']}
            rows={(markets || []).map((market) => [market.code, market.name, <StatusBadge value={market.status} />, formatDate(market.open_date), formatDate(market.close_date)])}
          />
        </section>
        <FormPanel title="สร้างตลาด" onSubmit={submit} loading={loading} error={error}>
          <TextInput label="Code" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} required />
          <TextInput label="ชื่อตลาด" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="รายละเอียด" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
          <TextInput label="วันเปิด" type="date" value={form.openDate} onChange={(value) => setForm((current) => ({ ...current, openDate: value }))} />
          <TextInput label="วันปิด" type="date" value={form.closeDate} onChange={(value) => setForm((current) => ({ ...current, closeDate: value }))} />
        </FormPanel>
      </div>
    </>
  );
}

function ProductsPage({ marketId }) {
  const { data = [], loading, reload } = useApi(marketId ? `/management/markets/${marketId}/products` : null, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [form, setForm] = useState({ categoryId: '1', groupId: '1', name: '' });

  async function submit(event) {
    event.preventDefault();
    await mutate(`/management/markets/${marketId}/products`, {
      categoryId: Number(form.categoryId),
      groupId: form.groupId ? Number(form.groupId) : null,
      name: form.name,
    });
    setForm((current) => ({ ...current, name: '' }));
    reload();
  }

  return (
    <>
      <PageHeader title="สินค้า" description="จัดการรายการสินค้าที่ผู้ขายเลือกตอนจองพื้นที่" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded bg-white p-5 shadow-sm">
          {loading ? (
            <LoadingBlock />
          ) : (
            <DataTable
              columns={['สินค้า', 'ประเภท', 'หมวดหมู่', 'สถานะ']}
              rows={(data || []).map((item) => [item.name, item.category_name || '-', item.group_name || '-', <StatusBadge value={item.status} />])}
            />
          )}
        </section>
        <FormPanel title="เพิ่มสินค้า" onSubmit={submit} loading={saving} error={error}>
          <TextInput label="Category ID" value={form.categoryId} onChange={(value) => setForm((current) => ({ ...current, categoryId: value }))} required />
          <TextInput label="Group ID" value={form.groupId} onChange={(value) => setForm((current) => ({ ...current, groupId: value }))} />
          <TextInput label="ชื่อสินค้า" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
        </FormPanel>
      </div>
    </>
  );
}

function CouponsPage({ marketId }) {
  const { data = [], loading, reload } = useApi(marketId ? `/management/markets/${marketId}/coupons` : null, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [form, setForm] = useState({
    name: '',
    code: '',
    discountType: 'amount',
    discountValue: '100',
    usageLimit: '10',
    startsAt: '2026-01-01 00:00:00',
    endsAt: '2026-12-31 23:59:59',
  });

  async function submit(event) {
    event.preventDefault();
    await mutate(`/management/markets/${marketId}/coupons`, {
      ...form,
      discountValue: Number(form.discountValue),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    });
    setForm((current) => ({ ...current, name: '', code: '' }));
    reload();
  }

  return (
    <>
      <PageHeader title="โค้ดส่วนลด" description="สร้างและติดตามสถานะคูปองสำหรับตลาดที่เลือก" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded bg-white p-5 shadow-sm">
          {loading ? (
            <LoadingBlock />
          ) : (
            <DataTable
              columns={['Code', 'ชื่อ', 'ส่วนลด', 'ช่วงเวลา', 'สถานะ']}
              rows={(data || []).map((coupon) => [
                coupon.code,
                coupon.name,
                `${coupon.discount_type} ${coupon.discount_value}`,
                `${formatDate(coupon.starts_at)} - ${formatDate(coupon.ends_at)}`,
                <StatusBadge value={coupon.status} />,
              ])}
            />
          )}
        </section>
        <FormPanel title="สร้างโค้ดส่วนลด" onSubmit={submit} loading={saving} error={error}>
          <TextInput label="ชื่อ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="Code" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} />
          <SelectInput label="ประเภทส่วนลด" value={form.discountType} onChange={(value) => setForm((current) => ({ ...current, discountType: value }))} options={[['amount', 'จำนวนเงิน'], ['percent', 'เปอร์เซ็นต์']]} />
          <TextInput label="มูลค่าส่วนลด" type="number" value={form.discountValue} onChange={(value) => setForm((current) => ({ ...current, discountValue: value }))} required />
          <TextInput label="จำนวนสิทธิ์" type="number" value={form.usageLimit} onChange={(value) => setForm((current) => ({ ...current, usageLimit: value }))} />
          <TextInput label="เริ่มต้น" value={form.startsAt} onChange={(value) => setForm((current) => ({ ...current, startsAt: value }))} required />
          <TextInput label="สิ้นสุด" value={form.endsAt} onChange={(value) => setForm((current) => ({ ...current, endsAt: value }))} required />
        </FormPanel>
      </div>
    </>
  );
}

function BookingsPage({ marketId }) {
  const { data = [], loading } = useApi(marketId ? `/management/markets/${marketId}/bookings` : null, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [form, setForm] = useState({ mobileUserId: '1', boothId: '2', bookingDate: '2026-05-14', productId: '1' });

  async function submit(event) {
    event.preventDefault();
    await mutate(`/management/markets/${marketId}/bookings`, {
      mobileUserId: Number(form.mobileUserId),
      items: [
        {
          boothId: Number(form.boothId),
          bookingDate: form.bookingDate,
          productIds: form.productId ? [Number(form.productId)] : [],
        },
      ],
    });
  }

  return (
    <>
      <PageHeader title="การจอง" description="รายการจองของตลาดและการจองแทนสมาชิก โดยยังต้องชำระเงินผ่านแอป" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded bg-white p-5 shadow-sm">
          {loading ? (
            <LoadingBlock />
          ) : (
            <DataTable
              columns={['Booking', 'สถานะ', 'ยอดเงิน', 'ช่องทาง', 'จำนวนบูธ', 'วันที่สร้าง']}
              rows={(data || []).map((booking) => [
                booking.public_id,
                <StatusBadge value={booking.status} />,
                formatMoney(booking.total_amount),
                booking.source,
                booking.item_count,
                formatDate(booking.created_at),
              ])}
            />
          )}
        </section>
        <FormPanel title="จองแทนสมาชิก" onSubmit={submit} loading={saving} error={error}>
          <TextInput label="Mobile User ID" value={form.mobileUserId} onChange={(value) => setForm((current) => ({ ...current, mobileUserId: value }))} required />
          <TextInput label="Booth ID" value={form.boothId} onChange={(value) => setForm((current) => ({ ...current, boothId: value }))} required />
          <TextInput label="วันที่จอง" type="date" value={form.bookingDate} onChange={(value) => setForm((current) => ({ ...current, bookingDate: value }))} required />
          <TextInput label="Product ID" value={form.productId} onChange={(value) => setForm((current) => ({ ...current, productId: value }))} />
        </FormPanel>
      </div>
    </>
  );
}

function ReportsPage() {
  const [range, setRange] = useState({ startDate: '2026-05-01', endDate: '2026-05-31' });
  const path = `/management/reports/bookings?startDate=${range.startDate}&endDate=${range.endDate}`;
  const { data = [], loading, reload } = useApi(path, { initialData: [] });

  return (
    <>
      <PageHeader
        title="Report"
        description="สรุปรายงานการจองแยกตามตลาดและสถานะ"
        action={
          <div className="flex flex-wrap gap-2">
            <input className="h-10 rounded border border-slate-300 px-3 text-sm" type="date" value={range.startDate} onChange={(event) => setRange((current) => ({ ...current, startDate: event.target.value }))} />
            <input className="h-10 rounded border border-slate-300 px-3 text-sm" type="date" value={range.endDate} onChange={(event) => setRange((current) => ({ ...current, endDate: event.target.value }))} />
            <button onClick={reload} className="inline-flex h-10 items-center gap-2 rounded bg-slate-950 px-3 text-sm font-semibold text-white">
              <Search className="h-4 w-4" />
              ค้นหา
            </button>
          </div>
        }
      />
      <section className="rounded bg-white p-5 shadow-sm">{loading ? <LoadingBlock /> : <ReportTable rows={data || []} />}</section>
    </>
  );
}

function AuditPage({ marketId }) {
  const { data = [], loading } = useApi(marketId ? `/management/markets/${marketId}/audit-checks` : null, { initialData: [] });

  return (
    <>
      <PageHeader title="ตรวจสอบตลาด" description="ผลตรวจจาก audit app พร้อมยอดค่าปรับและสถานะการชำระ" />
      <section className="rounded bg-white p-5 shadow-sm">
        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            columns={['Booking', 'Booth', 'วันที่จอง', 'ผลตรวจ', 'ค่าปรับ', 'สถานะค่าปรับ', 'วันที่ตรวจ']}
            rows={(data || []).map((item) => [
              item.booking_public_id,
              item.booth_name,
              formatDate(item.booking_date),
              <StatusBadge value={item.result} />,
              formatMoney(item.total_fine_amount),
              <StatusBadge value={item.fine_payment_status} />,
              formatDate(item.checked_at),
            ])}
          />
        )}
      </section>
    </>
  );
}

function AccountingPage() {
  const { data = [], loading } = useApi('/management/accounting/payments', { initialData: [] });
  return (
    <>
      <PageHeader title="บัญชี" description="รายการชำระเงินและข้อมูลอ้างอิงการจอง" />
      <section className="rounded bg-white p-5 shadow-sm">
        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            columns={['Payment', 'Booking', 'Provider', 'สถานะ', 'ยอดเงิน', 'วันที่ชำระ']}
            rows={(data || []).map((payment) => [
              payment.public_id,
              payment.booking_public_id || '-',
              payment.provider,
              <StatusBadge value={payment.status} />,
              formatMoney(payment.amount),
              formatDate(payment.paid_at || payment.created_at),
            ])}
          />
        )}
      </section>
    </>
  );
}

function AdminsPage({ marketId }) {
  const { mutate, loading, error } = useMutation();
  const [form, setForm] = useState({ username: '', password: 'Admin@123456', role: 'admin', name: '', email: '', phone: '', marketIds: String(marketId || 1) });
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    const marketIds = form.marketIds
      .split(',')
      .map((value) => Number(value.trim()))
      .filter(Boolean);
    await mutate('/management/admins', {
      ...form,
      marketIds,
    });
    setMessage('สร้างผู้ดูแลระบบสำเร็จ');
    setForm((current) => ({ ...current, username: '', name: '', email: '', phone: '' }));
  }

  return (
    <>
      <PageHeader title="ผู้ดูแลระบบ" description="สร้างบัญชีผู้ดูแลและกำหนดสิทธิ์ตลาดตามบทบาท" />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <RoleCard role="supervisor" description="เห็นทุกเมนู และทุกตลาดใน organization" />
            <RoleCard role="admin" description="เห็นตลาด สินค้า คูปอง จอง Report ตรวจสอบตลาด เฉพาะตลาดที่มอบหมาย" />
            <RoleCard role="accounting" description="เห็นเฉพาะเมนูบัญชี" />
            <RoleCard role="audit" description="ใช้เฉพาะ mobile audit app" />
          </div>
        </section>
        <FormPanel title="สร้างผู้ดูแล" onSubmit={submit} loading={loading} error={error || message}>
          <TextInput label="Username" value={form.username} onChange={(value) => setForm((current) => ({ ...current, username: value }))} required />
          <TextInput label="Password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} required />
          <SelectInput label="Role" value={form.role} onChange={(value) => setForm((current) => ({ ...current, role: value }))} options={[['admin', 'admin'], ['supervisor', 'supervisor'], ['accounting', 'accounting'], ['audit', 'audit']]} />
          <TextInput label="ชื่อ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <TextInput label="Phone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          <TextInput label="Market IDs" value={form.marketIds} onChange={(value) => setForm((current) => ({ ...current, marketIds: value }))} />
        </FormPanel>
      </div>
    </>
  );
}

function RoleCard({ role, description }) {
  return (
    <div className="rounded border border-slate-200 p-4">
      <p className="font-semibold text-slate-950">{role}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function ReportTable({ rows }) {
  return (
    <DataTable
      columns={['Market', 'สถานะ', 'จำนวน', 'ยอดรวม']}
      rows={(rows || []).map((row) => [row.market_name, <StatusBadge value={row.status} />, row.booking_count, formatMoney(row.total_amount)])}
    />
  );
}

function PaymentList({ rows }) {
  if (!rows?.length) return <EmptyState title="ยังไม่มีรายการชำระเงิน" />;
  return (
    <div className="space-y-3">
      {rows.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{payment.public_id}</p>
            <p className="text-xs text-slate-500">{payment.provider} · {formatDate(payment.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatMoney(payment.amount)}</p>
            <StatusBadge value={payment.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DataTable({ columns, rows }) {
  if (!rows?.length) return <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="whitespace-nowrap px-3 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormPanel({ title, children, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="rounded bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
      {error ? <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div> : null}
      <button disabled={loading} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
        <Plus className="h-4 w-4" />
        {loading ? 'กำลังบันทึก...' : 'บันทึก'}
      </button>
    </form>
  );
}

function TextInput({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200">
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
