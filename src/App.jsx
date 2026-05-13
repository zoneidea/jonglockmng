import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Eye,
  Image,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Percent,
  Plus,
  Search,
  Settings,
  Store,
  TicketCheck,
  UserCheck,
  Users,
  Utensils,
  Warehouse,
  X,
} from 'lucide-react';
import { API_BASE_URL } from './api/client.js';
import { useApi, useMutation } from './hooks/useApi.js';
import { useAuth } from './state/auth.jsx';

const menu = [
  { path: '/', label: 'ภาพรวม', icon: LayoutDashboard, menuKey: 'dashboard', roles: ['supervisor', 'admin'] },
  {
    label: 'จัดการตลาด',
    icon: Store,
    menuKey: 'markets',
    children: [
      { path: '/markets', label: 'รายชื่อตลาด' },
      { path: '/market-info', label: 'ข้อมูลทั่วไป' },
      { path: '/booth-types', label: 'แบบ Booth' },
      { path: '/booths', label: 'จัดการ Booth' },
      { path: '/holidays', label: 'จัดการวันหยุด' },
      { path: '/holiday-calendar', label: 'ปฏิทินวันหยุด' },
      { path: '/market-images', label: 'จัดการรูปภาพตลาด' },
      { path: '/accessories', label: 'จัดการบริการเสริม' },
    ],
  },
  {
    label: 'สินค้า',
    icon: Package,
    menuKey: 'products',
    children: [
      { path: '/product-categories', label: 'ประเภทสินค้า' },
      { path: '/product-groups', label: 'หมวดหมู่สินค้า' },
      { path: '/products', label: 'รายการสินค้า' },
    ],
  },
  {
    label: 'โค้ดส่วนลด',
    icon: Percent,
    menuKey: 'coupons',
    children: [
      { path: '/coupons', label: 'สร้างโค้ดส่วนลด' },
      { path: '/coupon-assignments', label: 'รายการที่แจกโค้ด' },
    ],
  },
  {
    label: 'การจอง',
    icon: CalendarCheck,
    menuKey: 'bookings',
    children: [
      { path: '/bookings', label: 'จอง Booth แทนสมาชิก' },
      { path: '/booking-edit', label: 'แก้ไขการจอง' },
      { path: '/booking-edits', label: 'รายการแก้ไขการจอง' },
    ],
  },
  {
    label: 'Report',
    icon: BarChart3,
    menuKey: 'reports',
    children: [
      { path: '/reports', label: 'รายงานการจอง' },
      { path: '/report-booths', label: 'รายงาน Booth ว่าง' },
      { path: '/report-payments', label: 'รายงานการชำระเงิน' },
      { path: '/report-daily', label: 'รายงานการขายรายวัน' },
      { path: '/report-person', label: 'การจองรายบุคคล' },
      { path: '/report-canceled', label: 'รายการหลุดจอง' },
    ],
  },
  {
    label: 'ตรวจสอบตลาด',
    icon: ClipboardCheck,
    menuKey: 'market_audit',
    children: [
      { path: '/audit', label: 'ข้อมูลการตรวจสอบ' },
      { path: '/audit-fines', label: 'รายชื่อผู้ค้างจ่ายค่าปรับ' },
      { path: '/audit-fines-paid', label: 'รายชื่อผู้จ่ายค่าปรับแบบโอน' },
      { path: '/audit-defective', label: 'รายการสินค้าชำรุด' },
    ],
  },
  {
    label: 'ประกาศ/ประชาสัมพันธ์',
    icon: Megaphone,
    menuKey: 'announcements',
    roles: ['supervisor', 'admin'],
    children: [
      { path: '/announcements/news', label: 'ข่าวสาร' },
      { path: '/announcements/banners', label: 'Banner' },
      { path: '/announcements/contact-us', label: 'Contact Us' },
    ],
  },
  {
    label: 'รายงานผู้เช่า',
    icon: UserCheck,
    menuKey: 'tenants',
    roles: ['supervisor', 'admin'],
    children: [
      { path: '/tenant-types', label: 'ประเภทผู้เช่า' },
      { path: '/tenants', label: 'รายชื่อผู้เช่า' },
      { path: '/tenants/pending', label: 'ผู้เช่ารอการอนุมัติ' },
    ],
  },
  {
    label: 'บัญชี',
    icon: CreditCard,
    menuKey: 'accounting',
    children: [
      { path: '/accounting', label: 'รายงานแสดงข้อมูลทั้งหมด' },
      { path: '/accounting-bookings', label: 'รายงานทะเบียนคุมใบจอง' },
      { path: '/accounting-payments', label: 'รายงานการชำระเงิน' },
      { path: '/accounting-summary', label: 'รายงานสรุปยอดขาย' },
      { path: '/accounting-sap', label: 'Excel To SAP' },
      { path: '/accounting-product-types', label: 'รายงานประเภทสินค้าที่ขาย' },
    ],
  },
  { path: '/pdpa', label: 'จัดการ PDPA', icon: Settings, menuKey: 'pdpa', roles: ['supervisor'] },
  { path: '/admins', label: 'ผู้ดูแลระบบ', icon: Users, menuKey: 'admins' },
];

const boothSamples = [
  { id: 'A1', type: 'อาหาร', status: 'active' },
  { id: 'A2', type: 'สำเร็จรูป', status: 'active' },
  { id: 'A3', type: 'ของหวาน', status: 'active' },
  { id: 'A4', type: 'อาหารปรุงสำเร็จ', status: 'active' },
  { id: 'A5', type: 'ต้ม ทอด นึ่ง ผัด ยำ', status: 'active' },
  { id: 'C1', type: 'เบ็ดเตล็ด', status: 'active' },
  { id: 'C2', type: 'เบ็ดเตล็ด', status: 'active' },
  { id: 'B1', type: 'แฟชั่น เครื่องแต่งกาย', status: 'active' },
  { id: 'B2', type: 'เครื่องใช้ครัวเรือน', status: 'active' },
  { id: 'B3', type: 'แฟชั่น เครื่องแต่งกาย', status: 'active' },
  { id: 'B4', type: 'สุขภาพ ความงาม', status: 'active' },
  { id: 'B5', type: 'เครื่องใช้ครัวเรือน', status: 'active' },
  { id: 'B6', type: 'เครื่องใช้ไฟฟ้า โทรศัพท์', status: 'active' },
  { id: 'B7', type: 'อาหารปรุงสำเร็จ', status: 'active' },
  { id: 'B8', type: 'ของหวาน', status: 'active' },
  { id: 'B9', type: 'น้ำ เครื่องดื่ม', status: 'active' },
  { id: 'B10', type: 'อาหารปรุงสำเร็จ', status: 'active' },
  { id: 'B11', type: 'อาหารปรุงสำเร็จ', status: 'active' },
  { id: 'B12', type: 'อาหารปรุงสำเร็จ', status: 'active' },
  { id: 'B13', type: 'อาหารปรุงสำเร็จ', status: 'active' },
  { id: 'B14', type: 'ของหวาน', status: 'active' },
  { id: 'B15', type: 'อาหารปรุงสำเร็จ', status: 'active' },
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

function dateKeyFromValue(value) {
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

function dateKeyFromUtcTime(time) {
  const date = new Date(time);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function utcTimeFromDateKey(key) {
  const [year, month, day] = String(key || '').split('-').map(Number);
  if (!year || !month || !day) return Number.NaN;
  return Date.UTC(year, month - 1, day);
}

function toTimePickerValue(value) {
  const match = String(value || '').replace('.', ':').match(/(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function splitOpeningHours(value) {
  const [start = '', end = ''] = String(value || '').split('-');
  return { openingStart: toTimePickerValue(start), openingEnd: toTimePickerValue(end) };
}

function combineOpeningHours(start, end) {
  if (!start && !end) return '';
  if (!end) return start;
  if (!start) return end;
  return `${start}-${end}`;
}

function toDateTimePickerValue(value) {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
}

function fromDateTimePickerValue(value) {
  if (!value) return '';
  const normalized = String(value).replace('T', ' ');
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

function normalizeRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function StatusBadge({ value }) {
  const status = String(value || '-').toLowerCase();
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    pending_payment: 'bg-amber-50 text-amber-700 ring-amber-200',
    payment_processing: 'bg-blue-50 text-blue-700 ring-blue-200',
    failed: 'bg-red-50 text-red-700 ring-red-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
    inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return <span className={classNames('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', styles[status] || styles.active)}>{value || '-'}</span>;
}

function EmptyState({ title = 'ไม่พบข้อมูล', description = 'ยังไม่มีรายการสำหรับเงื่อนไขนี้' }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

function ErrorNotice({ error, hint }) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-semibold">โหลดข้อมูลจาก API ไม่สำเร็จ</p>
      <p className="mt-1">{error}</p>
      {hint ? <p className="mt-1 text-amber-700">{hint}</p> : null}
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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.2fr_0.8fr]">
        <section className="flex items-center bg-[radial-gradient(circle_at_top_left,#14b8a6_0,#0f172a_35%,#020617_100%)] px-8 py-12 lg:px-16">
          <div className="max-w-2xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
              <Store size={16} /> Jonglock Management
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">ระบบจัดการตลาดและพื้นที่ขาย</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              จัดการตลาด บูธ วันหยุด รูปภาพ บริการเสริม สินค้า การจอง การชำระเงิน และรายงานในหน้าจอเดียว
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['Multi organization', 'Role based access', 'API connected'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-slate-100">
                  <BadgeCheck className="mb-3 text-cyan-300" size={20} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center bg-slate-100 px-6 py-12 text-slate-950">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Market Operations</p>
            <h2 className="mt-2 text-2xl font-bold">เข้าสู่ระบบจัดการ</h2>
            <p className="mt-2 text-sm text-slate-500">ใช้บัญชี supervisor, admin หรือ accounting</p>
            <div className="mt-8 space-y-4">
              <TextInput label="Username" value={form.username} onChange={(value) => setForm((current) => ({ ...current, username: value }))} required />
              <TextInput label="Password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} type="password" required />
            </div>
            {error ? <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
            <p className="mt-4 break-all text-xs text-slate-400">API: {API_BASE_URL}</p>
          </form>
        </section>
      </div>
    </div>
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
  const { data: markets = [], loading: marketsLoading, reload: reloadMarkets } = useApi(canLoadMarkets ? '/markets' : null, {
    initialData: [],
    skip: !canLoadMarkets,
  });
  const marketRows = normalizeRows(markets);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const currentMarketId = selectedMarketId || marketRows?.[0]?.id || '';
  const currentMarket = marketRows.find((market) => String(market.id) === String(currentMarketId)) || marketRows?.[0] || null;

  const availableMenu = useMemo(() => {
    const allowed = new Set([...(user?.menus || []), 'dashboard']);
    return menu.filter((item) => allowed.has(item.menuKey) || item.roles?.includes(user?.role));
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar items={availableMenu} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <Topbar
          user={user}
          markets={marketRows}
          currentMarketId={currentMarketId}
          marketsLoading={marketsLoading}
          onSelectMarket={setSelectedMarketId}
          onOpenSidebar={() => setSidebarOpen(true)}
          onLogout={logout}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard marketId={currentMarketId} markets={marketRows} />} />
            <Route path="/markets" element={<MarketsPage markets={marketRows} reloadMarkets={reloadMarkets} />} />
            <Route path="/market-info" element={<MarketInfoPage marketId={currentMarketId} market={currentMarket} reloadMarkets={reloadMarkets} />} />
            <Route path="/booth-types" element={<BoothTypesPage marketId={currentMarketId} />} />
            <Route path="/booths" element={<BoothsPage marketId={currentMarketId} />} />
            <Route path="/holidays" element={<MarketHolidaysPage marketId={currentMarketId} />} />
            <Route path="/holiday-calendar" element={<HolidayCalendarPage marketId={currentMarketId} />} />
            <Route path="/market-images" element={<MarketImagesPage marketId={currentMarketId} />} />
            <Route path="/accessories" element={<AccessoriesPage marketId={currentMarketId} />} />
            <Route path="/product-categories" element={<ProductCategoriesPage marketId={currentMarketId} />} />
            <Route path="/product-groups" element={<ProductGroupsPage marketId={currentMarketId} />} />
            <Route path="/products" element={<ProductsPage marketId={currentMarketId} />} />
            <Route path="/coupons" element={<CouponsPage marketId={currentMarketId} />} />
            <Route path="/coupon-assignments" element={<CouponsPage marketId={currentMarketId} mode="assignments" />} />
            <Route path="/bookings" element={<BookingsPage marketId={currentMarketId} />} />
            <Route path="/booking-edit" element={<BookingsPage marketId={currentMarketId} mode="edit" />} />
            <Route path="/booking-edits" element={<BookingsPage marketId={currentMarketId} mode="history" />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/report-booths" element={<ReportsPage reportType="booths" />} />
            <Route path="/report-payments" element={<AccountingPage />} />
            <Route path="/report-daily" element={<ReportsPage reportType="daily" />} />
            <Route path="/report-person" element={<ReportsPage reportType="person" />} />
            <Route path="/report-canceled" element={<ReportsPage reportType="canceled" />} />
            <Route path="/audit" element={<AuditPage marketId={currentMarketId} />} />
            <Route path="/audit-fines" element={<AuditPage marketId={currentMarketId} mode="fines" />} />
            <Route path="/audit-fines-paid" element={<AuditPage marketId={currentMarketId} mode="paid" />} />
            <Route path="/audit-defective" element={<AuditPage marketId={currentMarketId} mode="defective" />} />
            <Route path="/announcements/news" element={<AnnouncementsPage type="news" />} />
            <Route path="/announcements/banners" element={<AnnouncementsPage type="banner" />} />
            <Route path="/announcements/contact-us" element={<ContactUsPage />} />
            <Route path="/tenant-types" element={<TenantTypesPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/tenants/pending" element={<TenantsPage status="pending" />} />
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/accounting-bookings" element={<ReportsPage reportType="accounting-bookings" />} />
            <Route path="/accounting-payments" element={<AccountingPage />} />
            <Route path="/accounting-summary" element={<ReportsPage reportType="summary" />} />
            <Route path="/accounting-sap" element={<ReportsPage reportType="sap" />} />
            <Route path="/accounting-product-types" element={<ReportsPage reportType="product-types" />} />
            <Route path="/pdpa" element={<PdpaPage />} />
            <Route path="/admins" element={<AdminsPage marketId={currentMarketId} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ items, open, onClose }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState({ markets: true });
  const activeMenuKey = items.find((item) => item.children?.some((child) => location.pathname === child.path))?.menuKey;

  useEffect(() => {
    if (!activeMenuKey) return;
    setExpanded({ [activeMenuKey]: true });
  }, [activeMenuKey]);

  return (
    <>
      <div className={classNames('fixed inset-0 z-40 bg-slate-950/40 lg:hidden', open ? 'block' : 'hidden')} onClick={onClose} />
      <aside className={classNames('fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div>
            <div className="text-xl font-extrabold">Jonglock</div>
            <div className="text-xs text-slate-400">Management Console</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10 lg:hidden"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</p>
          {items.map((item) => {
            const Icon = item.icon;
            const hasChildren = Boolean(item.children?.length);
            const activeChild = item.children?.some((child) => location.pathname === child.path);
            if (hasChildren) {
              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={() => setExpanded((current) => (current[item.menuKey] ? {} : { [item.menuKey]: true }))}
                    className={classNames('flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition', activeChild ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-300 hover:bg-white/10 hover:text-white')}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {expanded[item.menuKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {expanded[item.menuKey] ? (
                    <div className="mt-1 space-y-1 border-l border-white/10 pl-5">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          end
                          onClick={onClose}
                          className={({ isActive }) => classNames('block rounded-lg px-3 py-2 text-sm transition', isActive ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:bg-white/10 hover:text-white')}
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => classNames('mb-1 flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition', isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white')}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function Topbar({ user, markets, currentMarketId, marketsLoading, onSelectMarket, onOpenSidebar, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={onOpenSidebar} className="rounded-xl border border-slate-200 p-2 lg:hidden"><Menu size={20} /></button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold text-slate-950">ระบบจัดการตลาด</h1>
          <p className="text-xs text-slate-500">Role: {user?.role || '-'} · API connected</p>
        </div>
        {marketsLoading || markets.length ? (
          <select value={currentMarketId} onChange={(event) => onSelectMarket(event.target.value)} className="hidden h-11 min-w-64 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 sm:block">
            {marketsLoading ? <option>Loading...</option> : null}
            {markets.map((market) => (
              <option key={market.id} value={market.id}>{market.name}</option>
            ))}
          </select>
        ) : null}
        <button onClick={onLogout} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800">
          <LogOut size={16} />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}

function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function Card({ children, className = '' }) {
  return <div className={classNames('rounded-3xl border border-slate-200 bg-white p-6 shadow-soft', className)}>{children}</div>;
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {Icon ? <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><Icon size={20} /></div> : null}
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
    </div>
  );
}

function NeedMarket() {
  return <EmptyState title="กรุณาเลือกตลาด" description="เลือกตลาดจากด้านบนก่อนจัดการข้อมูลส่วนนี้" />;
}

function Stat({ label, value, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-950 text-white',
    emerald: 'bg-emerald-600 text-white',
    blue: 'bg-blue-600 text-white',
    amber: 'bg-amber-500 text-slate-950',
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={classNames('rounded-2xl p-3', tones[tone])}>{Icon ? <Icon size={22} /> : null}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-950">{value}</p>
      </div>
    </Card>
  );
}

function Dashboard({ marketId, markets }) {
  const { user } = useAuth();
  const canReadReports = ['supervisor', 'admin'].includes(user?.role);
  const canReadPayments = ['supervisor', 'accounting'].includes(user?.role);
  const { data: report = [], loading: reportLoading } = useApi(canReadReports ? '/reports/bookings' : null, { initialData: [], skip: !canReadReports });
  const { data: payments = [] } = useApi(canReadPayments ? '/accounting/payments' : null, { initialData: [], skip: !canReadPayments });
  const reportRows = normalizeRows(report);
  const paymentRows = normalizeRows(payments);
  const bookingCount = reportRows.reduce((sum, row) => sum + Number(row.booking_count || 0), 0);
  const revenue = reportRows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const paidPayments = paymentRows.filter((payment) => payment.status === 'paid').length;

  return (
    <>
      <PageHeader title="ภาพรวมระบบ" description={`Market ID: ${marketId || '-'}`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="จำนวนตลาด" value={markets.length} icon={Store} />
        <Stat label="จำนวนการจอง" value={bookingCount} icon={TicketCheck} tone="blue" />
        <Stat label="รายได้รวม" value={formatMoney(revenue)} icon={CreditCard} tone="emerald" />
        <Stat label="ชำระเงินแล้ว" value={paidPayments} icon={BadgeCheck} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionTitle title="สถานะการจอง" description="ข้อมูลสรุปตามช่วงวันที่จากรายงาน" icon={BarChart3} />
          {reportLoading ? <LoadingBlock /> : <ReportTable rows={reportRows} />}
        </Card>
        <Card>
          <SectionTitle title="รายการชำระเงินล่าสุด" description="แสดงรายการจากระบบบัญชี" icon={CreditCard} />
          <PaymentList rows={paymentRows} />
        </Card>
      </div>
    </>
  );
}

function MarketsPage({ markets, reloadMarkets }) {
  const { mutate, loading, error } = useMutation();
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '', openDate: '', closeDate: '' });
  const [mainImageFile, setMainImageFile] = useState(null);
  const rows = markets.filter((market) => `${market.code} ${market.name}`.toLowerCase().includes(keyword.toLowerCase()));

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append('code', form.code);
    payload.append('name', form.name);
    payload.append('description', form.description);
    if (form.openDate) payload.append('openDate', form.openDate);
    if (form.closeDate) payload.append('closeDate', form.closeDate);
    if (mainImageFile) payload.append('mainImage', mainImageFile);
    await mutate('/markets', payload);
    setForm({ code: '', name: '', description: '', openDate: '', closeDate: '' });
    setMainImageFile(null);
    setModalOpen(false);
    reloadMarkets();
  }

  return (
    <>
      <PageHeader
        title="รายชื่อตลาด"
        description="แสดงรายชื่อตลาดที่อยู่ภายใต้องค์กร"
        action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มตลาด</button>}
      />
      <div className="grid gap-6">
        <Card>
          <Toolbar keyword={keyword} onKeyword={setKeyword} />
          <DataTable
            columns={['ลำดับ', 'รหัสตลาด', 'ชื่อตลาด', 'วันเปิด', 'วันปิด', 'สถานะ', 'จัดการ']}
            rows={rows.map((market, index) => [
              index + 1,
              market.code || '-',
              market.name,
              formatDate(market.open_date),
              formatDate(market.close_date),
              <StatusBadge value={market.status || 'active'} />,
              <div className="flex flex-wrap gap-2"><SmallButton tone="cyan">ดูตลาด</SmallButton><SmallButton tone="amber">แก้ไขข้อมูล</SmallButton></div>,
            ])}
          />
        </Card>
        <Modal open={modalOpen} title="เพิ่มตลาด" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={loading} error={error}>
          <TextInput label="รหัสตลาด" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} required />
          <TextInput label="ชื่อตลาด" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="คำอธิบาย" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
          <FileInput label="รูปภาพหลักของตลาด" onChange={setMainImageFile} />
          {mainImageFile ? <FileSummary file={mainImageFile} /> : null}
          <DatePicker label="วันเปิด" value={form.openDate} onChange={(value) => setForm((current) => ({ ...current, openDate: value }))} />
          <DatePicker label="วันปิด" value={form.closeDate} onChange={(value) => setForm((current) => ({ ...current, closeDate: value }))} />
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

function MarketInfoPage({ marketId, market, reloadMarkets }) {
  const { mutate, loading, error } = useMutation();
  const openingHours = splitOpeningHours(market?.opening_hours || '08:30-17:30');
  const [form, setForm] = useState({
    name: market?.name || '',
    description: market?.description || '',
    address: market?.address || '',
    openingStart: openingHours.openingStart,
    openingEnd: openingHours.openingEnd,
    phone: market?.phone || '',
    lineId: market?.line_id || '',
    email: market?.email || '',
    terms: market?.terms || '',
  });
  const [mainImageFile, setMainImageFile] = useState(null);

  useEffect(() => {
    const nextOpeningHours = splitOpeningHours(market?.opening_hours || '08:30-17:30');
    setForm({
      name: market?.name || '',
      description: market?.description || '',
      address: market?.address || '',
      openingStart: nextOpeningHours.openingStart,
      openingEnd: nextOpeningHours.openingEnd,
      phone: market?.phone || '',
      lineId: market?.line_id || '',
      email: market?.email || '',
      terms: market?.terms || '',
    });
    setMainImageFile(null);
  }, [market]);

  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append('name', form.name || '');
    payload.append('description', form.description || '');
    payload.append('address', form.address || '');
    payload.append('openingHours', combineOpeningHours(form.openingStart, form.openingEnd));
    payload.append('phone', form.phone || '');
    payload.append('lineId', form.lineId || '');
    payload.append('email', form.email || '');
    payload.append('terms', form.terms || '');
    if (mainImageFile) payload.append('mainImage', mainImageFile);
    await mutate(`/markets/${marketId}`, payload, 'PATCH');
    setMainImageFile(null);
    reloadMarkets?.();
  }

  return (
    <>
      <PageHeader title="ข้อมูลทั่วไป" description="จัดการข้อมูลทั่วไปของตลาด" />
      <Card>
        <FormPanel title="ข้อมูลทั่วไป" onSubmit={submit} loading={loading} error={error}>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center"><Label>ชื่อตลาด</Label><TextInputBare value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center"><Label>คำอธิบาย</Label><TextInputBare value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
            <Label>รูปภาพหลัก</Label>
            <div className="space-y-3">
              {market?.main_image_url ? <img src={market.main_image_url} alt={market.name || 'market'} className="h-56 w-full max-w-xl rounded-2xl object-cover" /> : <div className="flex h-40 max-w-xl items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-400">ยังไม่มีรูปภาพหลัก</div>}
              <FileInput label="อัพโหลดรูปภาพหลัก" onChange={setMainImageFile} />
              {mainImageFile ? <FileSummary file={mainImageFile} /> : null}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center"><Label>ที่ตั้ง</Label><TextInputBare value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
            <Label>เวลาทำการ</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <TimePicker label="เวลาเปิด" value={form.openingStart} onChange={(value) => setForm((current) => ({ ...current, openingStart: value }))} />
              <TimePicker label="เวลาปิด" value={form.openingEnd} onChange={(value) => setForm((current) => ({ ...current, openingEnd: value }))} />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center"><Label>เบอร์โทร</Label><TextInputBare value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center"><Label>Line ID</Label><TextInputBare value={form.lineId} onChange={(value) => setForm((current) => ({ ...current, lineId: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center"><Label>Email</Label><TextInputBare value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]"><Label>เงื่อนไขข้อตกลง</Label><textarea value={form.terms} onChange={(event) => setForm((current) => ({ ...current, terms: event.target.value }))} rows={5} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></div>
        </FormPanel>
      </Card>
    </>
  );
}

function BoothTypesPage({ marketId }) {
  const { data = [], loading, error, reload } = useApi(marketId ? `/markets/${marketId}/booth-types` : null, { initialData: [] });
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'active' });
  const rows = normalizeRows(data);

  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/booth-types`, form);
    setForm({ name: '', startDate: '', endDate: '', status: 'active' });
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title="แบบ Booth" description="จัดการรูปแบบบูธและช่วงวันที่เปิดใช้งาน" action={<div className="flex gap-2"><OutlineButton>Copy Booth</OutlineButton><button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มแบบ Booth</button></div>} />
      <div className="grid gap-6">
        <Card>
          <ErrorNotice error={error} hint="ถ้ายังไม่มี endpoint นี้ ให้เพิ่ม backend endpoint /markets/:marketId/booth-types" />
          {loading ? <LoadingBlock /> : (
            <DataTable
              columns={['ลำดับ', 'ชื่อแบบ', 'เริ่มต้น', 'สิ้นสุด', 'สถานะ', 'จัดการ']}
              rows={rows.map((item, index) => [index + 1, item.name || item.title, formatDate(item.start_date), formatDate(item.end_date), <StatusBadge value={item.status || 'active'} />, <div className="flex gap-2"><SmallButton tone="cyan">ดูข้อมูล Booths</SmallButton><SmallButton tone="amber">แก้ไขข้อมูล</SmallButton></div>])}
            />
          )}
        </Card>
        <Modal open={modalOpen} title="เพิ่มแบบ Booth" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={saveError}>
          <TextInput label="ชื่อแบบ Booth" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <DatePicker label="วันที่เริ่มต้น" value={form.startDate} onChange={(value) => setForm((current) => ({ ...current, startDate: value }))} />
          <DatePicker label="วันที่สิ้นสุด" value={form.endDate} onChange={(value) => setForm((current) => ({ ...current, endDate: value }))} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ระงับการใช้']]} />
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

function BoothsPage({ marketId }) {
  const { data = [], loading, error, reload } = useApi(marketId ? `/markets/${marketId}/booths` : null, { initialData: [] });
  const { data: categories = [] } = useApi(marketId ? `/markets/${marketId}/categories` : null, { initialData: [] });
  const { data: boothTypes = [] } = useApi(marketId ? `/markets/${marketId}/booth-types` : null, { initialData: [] });
  const { mutate, loading: saving, error: saveError } = useMutation();
  const rows = normalizeRows(data);
  const categoryRows = normalizeRows(categories);
  const typeRows = normalizeRows(boothTypes);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ floorPlanId: '', categoryId: '', code: '', name: '', price: '500', sortOrder: '0', status: 'active' });

  useEffect(() => {
    if (!selectedType && typeRows[0]?.id) {
      setSelectedType(String(typeRows[0].id));
    }
  }, [selectedType, typeRows]);

  const filteredRows = rows.filter((booth) => {
    if (!selectedType) return false;
    if (String(booth.floor_plan_id || booth.floorPlanId || '') !== String(selectedType)) return false;
    if (selectedCategory === 'all') return true;
    return String(booth.category_id || booth.categoryId || '') === String(selectedCategory);
  });

  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/booths`, {
      ...form,
      floorPlanId: Number(form.floorPlanId || typeRows[0]?.id) || null,
      categoryId: Number(form.categoryId || categoryRows[0]?.id) || null,
      price: Number(form.price),
      sortOrder: Number(form.sortOrder),
    });
    setForm({ floorPlanId: selectedType || '', categoryId: '', code: '', name: '', price: '500', sortOrder: '0', status: 'active' });
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title="จัดการ Booth ต่างๆ" description="เลือกแบบ Booth ก่อน แล้วกรองตามประเภทสินค้าที่ผูกกับบูธ" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่ม Booth</button>} />
      <Card>
        <ErrorNotice error={error} hint="ตรวจสอบ endpoint /markets/:marketId/booths และความสัมพันธ์ booths.category_id -> product_categories.id" />
        <div className="mb-8 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-cyan-600">
            <option value="">กรุณาเลือก แบบ Booth</option>
            {typeRows.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <FilterPill active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')}>ทั้งหมด</FilterPill>
            {categoryRows.map((category) => (
              <FilterPill key={category.id} active={String(selectedCategory) === String(category.id)} onClick={() => setSelectedCategory(String(category.id))}>
                {category.name}
              </FilterPill>
            ))}
          </div>
        </div>
        {!selectedType ? (
          <EmptyState title="ยังไม่ได้เลือกแบบ Booth" description="เลือกแบบ Booth จากรายการด้านซ้ายก่อน เพื่อแสดงผังและรายการบูธ" />
        ) : loading ? <LoadingBlock /> : filteredRows.length ? (
          <div className="flex flex-wrap gap-5">
            {filteredRows.map((booth) => (
              <BoothBox
                key={booth.id || booth.code || booth.name}
                danger={booth.status !== 'active'}
                label={booth.code || booth.name || booth.id}
                subLabel={booth.category_name || 'ยังไม่ระบุ'}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="ไม่พบบูธตามเงื่อนไข" description="แบบ Booth นี้ยังไม่มีบูธ หรือไม่มีบูธในประเภทที่เลือก" />
        )}
      </Card>
      <Modal open={modalOpen} title="เพิ่ม Booth" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={saveError}>
          <SelectInput label="แบบ Booth" value={form.floorPlanId || selectedType || typeRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, floorPlanId: value }))} options={typeRows.map((item) => [String(item.id), item.name])} />
          <SelectInput label="ประเภทสินค้า" value={form.categoryId || categoryRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, categoryId: value }))} options={categoryRows.map((item) => [String(item.id), item.name])} />
          <TextInput label="รหัส Booth" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} required />
          <TextInput label="ชื่อ Booth" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="ราคา" type="number" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} />
          <TextInput label="ลำดับ" type="number" value={form.sortOrder} onChange={(value) => setForm((current) => ({ ...current, sortOrder: value }))} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ปิดการใช้งาน'], ['maintenance', 'ซ่อมบำรุง']]} />
        </FormPanel>
      </Modal>
    </>
  );
}

function FilterPill({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'inline-flex h-11 items-center rounded-xl border px-4 text-sm font-bold transition',
        active ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700',
      )}
    >
      {children}
    </button>
  );
}

function BoothBox({ label, subLabel, danger = false }) {
  return (
    <button className={classNames('flex min-h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed px-2 text-center text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5', danger ? 'border-red-300 bg-red-500' : 'border-cyan-200 bg-cyan-600')}>
      <span>{label}</span>
      <span className="mt-1 text-xs leading-5 opacity-90">{subLabel}</span>
    </button>
  );
}

function MarketHolidaysPage({ marketId }) {
  const { data = [], loading, error, reload } = useApi(marketId ? `/markets/${marketId}/holidays` : null, { initialData: [] });
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '' });
  const rows = normalizeRows(data);

  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/holidays`, form);
    setForm({ title: '', startDate: '', endDate: '' });
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title="จัดการวันหยุดตลาด" description="เพิ่ม แก้ไข และตรวจสอบวันหยุดของตลาด" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มวันหยุด</button>} />
      <div className="grid gap-6">
        <Card>
          <ErrorNotice error={error} hint="ถ้ายังไม่มี endpoint นี้ ให้เพิ่ม backend endpoint /markets/:marketId/holidays" />
          {loading ? <LoadingBlock /> : <DataTable columns={['ลำดับ', 'ชื่อวันหยุด', 'วันที่เริ่ม', 'วันที่สิ้นสุด', 'สถานะ']} rows={rows.map((item, index) => [index + 1, item.title || item.name, formatDate(item.start_date || item.startDate), formatDate(item.end_date || item.endDate), <StatusBadge value={item.status || 'active'} />])} />}
        </Card>
        <Modal open={modalOpen} title="เพิ่มวันหยุด" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={saveError}>
          <TextInput label="ชื่อวันหยุด" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
          <DatePicker label="วันที่เริ่ม" value={form.startDate} onChange={(value) => setForm((current) => ({ ...current, startDate: value }))} required />
          <DatePicker label="วันที่สิ้นสุด" value={form.endDate} onChange={(value) => setForm((current) => ({ ...current, endDate: value }))} required />
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

function HolidayCalendarPage({ marketId }) {
  const { data = [], loading, error } = useApi(marketId ? `/markets/${marketId}/holidays` : null, { initialData: [] });
  const rows = normalizeRows(data);
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const monthStartTime = Date.UTC(year, month, 1);
  const monthEndTime = Date.UTC(year, month, days);
  const holidaysByDate = rows
    .filter((holiday) => (holiday.status || 'active') === 'active')
    .reduce((current, holiday) => {
      const startKey = dateKeyFromValue(holiday.start_date || holiday.startDate);
      const endKey = dateKeyFromValue(holiday.end_date || holiday.endDate || holiday.start_date || holiday.startDate);
      const startTime = Math.max(utcTimeFromDateKey(startKey), monthStartTime);
      const endTime = Math.min(utcTimeFromDateKey(endKey), monthEndTime);
      if (Number.isNaN(startTime) || Number.isNaN(endTime) || startTime > endTime) return current;

      for (let time = startTime; time <= endTime; time += 86400000) {
        const key = dateKeyFromUtcTime(time);
        current[key] = [...(current[key] || []), holiday];
      }
      return current;
    }, {});
  const cells = [];
  for (let i = 0; i < first.getDay(); i += 1) cells.push(null);
  for (let day = 1; day <= days; day += 1) cells.push(day);

  if (!marketId) return <NeedMarket />;

  return (
    <>
      <PageHeader title="ปฏิทินวันหยุดตลาด" description="ภาพรวมวันหยุดตลาดทั้งหมด" action={<div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white"><button className="bg-blue-600 px-4 py-2 text-sm font-bold text-white">Month</button><button className="px-4 py-2 text-sm font-bold text-slate-600">Week</button><button className="px-4 py-2 text-sm font-bold text-slate-600">Day</button></div>} />
      <Card>
        <ErrorNotice error={error} hint="ถ้า endpoint วันหยุดยังไม่พร้อม ปฏิทินจะแสดงเฉพาะโครง UI ก่อน" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(today)}</h2>
          <button className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white">Today</button>
        </div>
        {loading ? (
          <LoadingBlock />
        ) : (
          <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((item) => <div key={item} className="border-b border-slate-200 bg-slate-50 py-3 text-center text-sm font-bold">{item}</div>)}
            {cells.map((day, index) => {
              const dateKey = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const dayHolidays = holidaysByDate[dateKey] || [];
              return (
                <div key={`${day}-${index}`} className={classNames('min-h-28 border-b border-r border-slate-200 p-2 text-right text-sm', day === today.getDate() ? 'bg-amber-50' : 'bg-white')}>
                  <span className={day ? 'text-slate-700' : 'text-slate-300'}>{day || ''}</span>
                  {dayHolidays.slice(0, 3).map((holiday) => (
                    <div key={`${holiday.id}-${dateKey}`} title={holiday.title || holiday.name || 'วันหยุดตลาด'} className="mt-2 truncate rounded bg-green-700 px-2 py-1 text-left text-xs font-bold text-white">
                      {holiday.title || holiday.name || 'วันหยุดตลาด'}
                    </div>
                  ))}
                  {dayHolidays.length > 3 ? <div className="mt-1 text-left text-xs font-bold text-green-700">+{dayHolidays.length - 3} รายการ</div> : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function MarketImagesPage({ marketId }) {
  const { data = [], loading, error, reload } = useApi(marketId ? `/markets/${marketId}/images` : null, { initialData: [] });
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [form, setForm] = useState({ title: '', sortOrder: '0', status: 'active' });
  const [editForm, setEditForm] = useState({ title: '', sortOrder: '0', status: 'active' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedEditFile, setSelectedEditFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const rows = normalizeRows(data);

  if (!marketId) return <NeedMarket />;

  function openCreateModal() {
    setForm({ title: '', sortOrder: '0', status: 'active' });
    setSelectedFiles([]);
    setUploadError('');
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingImage(item);
    setEditForm({
      title: item.title || '',
      sortOrder: String(item.sort_order ?? item.sortOrder ?? 0),
      status: item.status || 'active',
    });
    setSelectedEditFile(null);
    setUploadError('');
    setEditModalOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    if (!selectedFiles.length) {
      setUploadError('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');
      return;
    }
    setUploadError('');
    const payload = new FormData();
    payload.append('title', form.title);
    payload.append('sortOrder', form.sortOrder);
    payload.append('status', form.status);
    selectedFiles.forEach((file) => payload.append('images', file));
    await mutate(`/markets/${marketId}/images`, payload);
    setForm({ title: '', sortOrder: '0', status: 'active' });
    setSelectedFiles([]);
    setModalOpen(false);
    reload();
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingImage) return;
    setUploadError('');
    const payload = new FormData();
    payload.append('title', editForm.title);
    payload.append('sortOrder', editForm.sortOrder);
    payload.append('status', editForm.status);
    if (selectedEditFile) payload.append('image', selectedEditFile);
    await mutate(`/markets/${marketId}/images/${editingImage.id}`, payload, 'PATCH');
    setEditingImage(null);
    setSelectedEditFile(null);
    setEditModalOpen(false);
    reload();
  }

  async function toggleStatus(item) {
    const payload = new FormData();
    payload.append('title', item.title || '');
    payload.append('sortOrder', String(item.sort_order ?? item.sortOrder ?? 0));
    payload.append('status', item.status === 'active' ? 'inactive' : 'active');
    await mutate(`/markets/${marketId}/images/${item.id}`, payload, 'PATCH');
    reload();
  }

  return (
    <>
      <PageHeader title="จัดการรูปภาพตลาด" description="ข้อมูลรูปภาพทั้งหมดของตลาดนี้" action={<button onClick={openCreateModal} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มรูปภาพ</button>} />
      <Card>
        <ErrorNotice error={error} hint="ตรวจสอบ endpoint /markets/:marketId/images และสิทธิ์การเข้าถึงตลาด" />
        {loading ? <LoadingBlock /> : (
          rows.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-64 bg-slate-100">
                    <img src={item.image_url} alt={item.title || 'market'} className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-950/60 to-transparent p-5 text-white">
                      <p className="text-lg font-bold">สถานะ : <span className="text-emerald-300">{item.status || 'เปิดใช้งาน'}</span></p>
                      {item.title ? <p className="mt-1 truncate text-sm text-white/80">{item.title}</p> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 p-4">
                    <SmallButton tone="slate" onClick={() => window.open(item.image_url, '_blank', 'noopener,noreferrer')}><Eye size={14} /> ดู</SmallButton>
                    <SmallButton tone="amber" onClick={() => openEditModal(item)}>แก้ไข</SmallButton>
                    <SmallButton tone="cyan" onClick={() => toggleStatus(item)}>{item.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</SmallButton>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="ยังไม่มีรูปภาพตลาด" description="อัพโหลดรูปภาพตลาดเพื่อแสดงในแอปและหน้าจัดการ" />
        )}
      </Card>
      <Modal open={modalOpen} title="เพิ่มรูปภาพตลาด" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={uploadError || saveError}>
          <TextInput label="ชื่อรูปภาพ" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-600">รูปภาพ</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(event) => {
                setSelectedFiles(Array.from(event.target.files || []));
                setUploadError('');
              }}
              className="block w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-cyan-700 hover:border-cyan-400"
            />
          </label>
          {selectedFiles.length ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-bold text-slate-700">เลือกแล้ว {selectedFiles.length} รูป</p>
              <p className="mt-1 truncate">{selectedFiles.map((file) => file.name).join(', ')}</p>
            </div>
          ) : null}
          <TextInput label="ลำดับ" type="number" value={form.sortOrder} onChange={(value) => setForm((current) => ({ ...current, sortOrder: value }))} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'เปิดใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
      </Modal>
      <Modal open={editModalOpen} title="แก้ไขรูปภาพตลาด" onClose={() => setEditModalOpen(false)}>
        <FormPanel onSubmit={submitEdit} loading={saving} error={uploadError || saveError}>
          <TextInput label="ชื่อรูปภาพ" value={editForm.title} onChange={(value) => setEditForm((current) => ({ ...current, title: value }))} />
          {editingImage?.image_url ? <img src={editingImage.image_url} alt={editingImage.title || 'market'} className="h-48 w-full rounded-2xl object-cover" /> : null}
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-600">อัพโหลดรูปภาพใหม่</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => setSelectedEditFile(event.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-cyan-700 hover:border-cyan-400"
            />
          </label>
          {selectedEditFile ? <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">เลือกแล้ว {selectedEditFile.name}</div> : null}
          <TextInput label="ลำดับ" type="number" value={editForm.sortOrder} onChange={(value) => setEditForm((current) => ({ ...current, sortOrder: value }))} />
          <SelectInput label="สถานะ" value={editForm.status} onChange={(value) => setEditForm((current) => ({ ...current, status: value }))} options={[['active', 'เปิดใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
      </Modal>
    </>
  );
}

function AccessoriesPage({ marketId }) {
  const { data = [], loading, error, reload } = useApi(marketId ? `/markets/${marketId}/accessories` : null, { initialData: [] });
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', price: '100', quantity: '1', status: 'active' });
  const [imageFile, setImageFile] = useState(null);
  const rows = normalizeRows(data);

  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('price', form.price);
    payload.append('quantity', form.quantity);
    payload.append('status', form.status);
    if (imageFile) payload.append('image', imageFile);
    await mutate(`/markets/${marketId}/accessories`, payload);
    setForm({ name: '', price: '100', quantity: '1', status: 'active' });
    setImageFile(null);
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title="บริการเสริม" description="แสดงรายการบริการเสริมของแต่ละตลาด" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-amber-300 px-4 text-sm font-bold text-amber-700"><Plus size={16} /> เพิ่มบริการ</button>} />
      <div className="grid gap-6">
        <Card>
          <ErrorNotice error={error} hint="ถ้ายังไม่มี endpoint นี้ ให้เพิ่ม backend endpoint /markets/:marketId/accessories" />
          {loading ? <LoadingBlock /> : (
            <DataTable
              columns={['ลำดับที่', 'ชื่อบริการ', 'รูปภาพ', 'ราคา', 'จำนวน', 'สถานะ', 'จัดการ']}
              rows={rows.map((item, index) => [index + 1, item.name, item.image_url ? <img src={item.image_url} className="h-20 w-20 rounded-xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100"><Image size={24} /></div>, formatMoney(item.price), item.quantity || 1, <StatusBadge value={item.status || 'active'} />, <SmallButton tone="red">ปิดการใช้งาน</SmallButton>])}
            />
          )}
        </Card>
        <Modal open={modalOpen} title="เพิ่มบริการเสริม" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={saveError}>
          <TextInput label="ชื่อบริการ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <FileInput label="รูปภาพบริการเสริม" onChange={setImageFile} />
          {imageFile ? <FileSummary file={imageFile} /> : null}
          <TextInput label="ราคา" type="number" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} required />
          <TextInput label="จำนวน" type="number" value={form.quantity} onChange={(value) => setForm((current) => ({ ...current, quantity: value }))} required />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

function ProductCategoriesPage({ marketId }) {
  const { data = [], loading, reload } = useApi(marketId ? `/markets/${marketId}/categories` : null, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', status: 'active' });
  const rows = normalizeRows(data);
  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/categories`, form);
    setForm({ name: '', status: 'active' });
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title="ประเภทสินค้า" description="จัดการประเภทสินค้าสำหรับตลาด" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มประเภทสินค้า</button>} />
      <Card>{loading ? <LoadingBlock /> : <DataTable columns={['ลำดับ', 'ชื่อประเภท', 'สถานะ']} rows={rows.map((item, index) => [index + 1, item.name, <StatusBadge value={item.status} />])} />}</Card>
      <Modal open={modalOpen} title="เพิ่มประเภทสินค้า" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={error}>
          <TextInput label="ชื่อประเภทสินค้า" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
      </Modal>
    </>
  );
}

function ProductGroupsPage({ marketId }) {
  const { data: categories = [] } = useApi(marketId ? `/markets/${marketId}/categories` : null, { initialData: [] });
  const { data = [], loading, reload } = useApi(marketId ? `/markets/${marketId}/groups` : null, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const categoryRows = normalizeRows(categories);
  const [form, setForm] = useState({ categoryId: '', name: '', status: 'active' });
  const rows = normalizeRows(data);
  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/groups`, { ...form, categoryId: Number(form.categoryId || categoryRows[0]?.id) });
    setForm({ categoryId: '', name: '', status: 'active' });
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title="หมวดหมู่สินค้า" description="จัดการหมวดหมู่สินค้าและผูกกับประเภทสินค้า" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มหมวดหมู่</button>} />
      <Card>{loading ? <LoadingBlock /> : <DataTable columns={['ลำดับ', 'ชื่อหมวดหมู่', 'ประเภทสินค้า', 'สถานะ']} rows={rows.map((item, index) => [index + 1, item.name, item.category_name || '-', <StatusBadge value={item.status} />])} />}</Card>
      <Modal open={modalOpen} title="เพิ่มหมวดหมู่สินค้า" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={error}>
          <SelectInput label="ประเภทสินค้า" value={form.categoryId || categoryRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, categoryId: value }))} options={categoryRows.map((item) => [String(item.id), item.name])} />
          <TextInput label="ชื่อหมวดหมู่" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
      </Modal>
    </>
  );
}

function ProductsPage({ marketId }) {
  const { data = [], loading, reload } = useApi(marketId ? `/markets/${marketId}/products` : null, { initialData: [] });
  const { data: categories = [] } = useApi(marketId ? `/markets/${marketId}/categories` : null, { initialData: [] });
  const { data: groups = [] } = useApi(marketId ? `/markets/${marketId}/groups` : null, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ categoryId: '', groupId: '', name: '' });
  const rows = normalizeRows(data);
  const categoryRows = normalizeRows(categories);
  const groupRows = normalizeRows(groups);
  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/products`, {
      categoryId: Number(form.categoryId || categoryRows[0]?.id),
      groupId: form.groupId ? Number(form.groupId) : null,
      name: form.name,
    });
    setForm((current) => ({ ...current, name: '' }));
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title="สินค้า" description="จัดการสินค้า/ประเภทสินค้าของตลาด" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มสินค้า</button>} />
      <div className="grid gap-6">
        <Card>{loading ? <LoadingBlock /> : <DataTable columns={['ชื่อสินค้า', 'หมวดหมู่', 'กลุ่มสินค้า']} rows={rows.map((item) => [item.name, item.category_name || '-', item.group_name || '-'])} />}</Card>
        <Modal open={modalOpen} title="เพิ่มสินค้า" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={error}>
          <SelectInput label="ประเภทสินค้า" value={form.categoryId || categoryRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, categoryId: value, groupId: '' }))} options={categoryRows.map((item) => [String(item.id), item.name])} />
          <SelectInput label="หมวดหมู่สินค้า" value={form.groupId} onChange={(value) => setForm((current) => ({ ...current, groupId: value }))} options={[['', 'ไม่ระบุ'], ...groupRows.filter((item) => !form.categoryId || String(item.category_id) === String(form.categoryId)).map((item) => [String(item.id), item.name])]} />
          <TextInput label="ชื่อสินค้า" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

function CouponsPage({ marketId, mode }) {
  const { data = [], loading, reload } = useApi(marketId ? `/markets/${marketId}/coupons` : null, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', discountType: 'amount', discountValue: '100', usageLimit: '10', startsAt: '2026-01-01T00:00', endsAt: '2026-12-31T23:59' });
  const rows = normalizeRows(data);
  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/coupons`, {
      ...form,
      startsAt: fromDateTimePickerValue(form.startsAt),
      endsAt: fromDateTimePickerValue(form.endsAt),
      discountValue: Number(form.discountValue),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    });
    setForm((current) => ({ ...current, name: '', code: '' }));
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader
        title={mode === 'assignments' ? 'รายการที่แจกโค้ด' : 'โค้ดส่วนลด'}
        description={mode === 'assignments' ? 'รายการแจกโค้ดส่วนลดให้ผู้จอง' : 'จัดการคูปองและโปรโมชั่น'}
        action={mode === 'assignments' ? null : <button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มคูปอง</button>}
      />
      <div className="grid gap-6">
        <Card>{loading ? <LoadingBlock /> : <DataTable columns={['โค้ด', 'ชื่อ', 'ส่วนลด', 'ช่วงวันที่', 'สถานะ']} rows={rows.map((coupon) => [coupon.code, coupon.name, `${coupon.discount_type || coupon.discountType} ${coupon.discount_value || coupon.discountValue}`, `${formatDate(coupon.starts_at || coupon.startsAt)} - ${formatDate(coupon.ends_at || coupon.endsAt)}`, <StatusBadge value={coupon.status || 'active'} />])} />}</Card>
        <Modal open={modalOpen} title="เพิ่มคูปอง" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={error}>
          <TextInput label="ชื่อคูปอง" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="Code" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} />
          <SelectInput label="ประเภทส่วนลด" value={form.discountType} onChange={(value) => setForm((current) => ({ ...current, discountType: value }))} options={[['amount', 'จำนวนเงิน'], ['percent', 'เปอร์เซ็นต์']]} />
          <TextInput label="มูลค่าส่วนลด" value={form.discountValue} onChange={(value) => setForm((current) => ({ ...current, discountValue: value }))} required />
          <TextInput label="จำนวนครั้งที่ใช้ได้" value={form.usageLimit} onChange={(value) => setForm((current) => ({ ...current, usageLimit: value }))} />
          <DateTimePicker label="เริ่มต้น" value={toDateTimePickerValue(form.startsAt)} onChange={(value) => setForm((current) => ({ ...current, startsAt: value }))} required />
          <DateTimePicker label="สิ้นสุด" value={toDateTimePickerValue(form.endsAt)} onChange={(value) => setForm((current) => ({ ...current, endsAt: value }))} required />
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

function AnnouncementsPage({ type }) {
  const title = type === 'banner' ? 'Banner' : 'ข่าวสาร';
  const { data = [], loading, reload } = useApi(`/announcements?type=${type}`, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', status: 'active' });
  const [imageFile, setImageFile] = useState(null);
  const rows = normalizeRows(data);

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append('type', type);
    payload.append('title', form.title);
    payload.append('description', form.description);
    if (form.startDate) payload.append('startDate', form.startDate);
    if (form.endDate) payload.append('endDate', form.endDate);
    payload.append('status', form.status);
    if (imageFile) payload.append('image', imageFile);
    await mutate('/announcements', payload);
    setForm({ title: '', description: '', startDate: '', endDate: '', status: 'active' });
    setImageFile(null);
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title={title} description="จัดการประกาศและประชาสัมพันธ์ภายใต้องค์กร" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่ม{title}</button>} />
      <Card>
        {loading ? <LoadingBlock /> : (
          <DataTable
            columns={['ลำดับ', 'รูปภาพ', 'หัวข้อ', 'ช่วงวันที่', 'สถานะ']}
            rows={rows.map((item, index) => [
              index + 1,
              item.image_url ? <img src={item.image_url} className="h-16 w-24 rounded-xl object-cover" /> : <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-slate-100"><Image size={20} /></div>,
              item.title,
              `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`,
              <StatusBadge value={item.status} />,
            ])}
          />
        )}
      </Card>
      <Modal open={modalOpen} title={`เพิ่ม${title}`} onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={error}>
          <TextInput label="หัวข้อ" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-600">รายละเอียด</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={5} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" />
          </label>
          <FileInput label="รูปภาพ" onChange={setImageFile} />
          {imageFile ? <FileSummary file={imageFile} /> : null}
          <DatePicker label="วันที่เริ่ม" value={form.startDate} onChange={(value) => setForm((current) => ({ ...current, startDate: value }))} />
          <DatePicker label="วันที่สิ้นสุด" value={form.endDate} onChange={(value) => setForm((current) => ({ ...current, endDate: value }))} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'เปิดใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
      </Modal>
    </>
  );
}

function ContactUsPage() {
  const { data = [], loading, reload } = useApi('/contact-us', { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', phone: '', email: '', lineId: '', address: '', status: 'active' });
  const rows = normalizeRows(data);

  async function submit(event) {
    event.preventDefault();
    await mutate('/contact-us', form);
    setForm({ title: '', phone: '', email: '', lineId: '', address: '', status: 'active' });
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title="Contact Us" description="จัดการช่องทางติดต่อที่แสดงในระบบ" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มข้อมูลติดต่อ</button>} />
      <Card>{loading ? <LoadingBlock /> : <DataTable columns={['หัวข้อ', 'โทรศัพท์', 'Email', 'Line', 'สถานะ']} rows={rows.map((item) => [item.title, item.phone || '-', item.email || '-', item.line_id || '-', <StatusBadge value={item.status} />])} />}</Card>
      <Modal open={modalOpen} title="เพิ่ม Contact Us" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={error}>
          <TextInput label="หัวข้อ" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
          <TextInput label="โทรศัพท์" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          <TextInput label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <TextInput label="Line ID" value={form.lineId} onChange={(value) => setForm((current) => ({ ...current, lineId: value }))} />
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-600">ที่อยู่</span><textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'เปิดใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
      </Modal>
    </>
  );
}

function TenantTypesPage() {
  const { data = [], loading, reload } = useApi('/tenant-types', { initialData: [] });
  const rows = normalizeRows(data);

  return (
    <>
      <PageHeader title="ประเภทผู้เช่า" description="ประเภทสมาชิกถูกกำหนดคงที่ภายใต้องค์กร: บุคคลธรรมดา และ นิติบุคคล" />
      <Card>{loading ? <LoadingBlock /> : <DataTable columns={['ลำดับ', 'ประเภทผู้เช่า', 'สถานะ']} rows={rows.map((item, index) => [index + 1, item.name, <StatusBadge value={item.status} />])} />}</Card>
    </>
  );
}

function validateTenantForm(form, mode = 'create') {
  if (!form.username || form.username.trim().length < 4) return 'Username ต้องมีอย่างน้อย 4 ตัวอักษร';
  if (mode === 'create' && (!form.password || form.password.length < 8)) return 'Password ต้องมีอย่างน้อย 8 ตัวอักษร';
  if (mode === 'edit' && form.password && form.password.length < 8) return 'Password ใหม่ต้องมีอย่างน้อย 8 ตัวอักษร';
  if (!form.tenantTypeId) return 'กรุณาเลือกประเภทสมาชิก';
  if (!form.name || !form.name.trim()) return 'กรุณากรอกชื่อผู้เช่า';
  if (!/^\d{9,20}$/.test(String(form.phone || '').replace(/\D/g, ''))) return 'เบอร์โทรไม่ถูกต้อง';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email || '').trim())) return 'อีเมลไม่ถูกต้อง';
  if (!/^\d{13,20}$/.test(String(form.idCard || '').replace(/\D/g, ''))) return 'เลขบัตรประชาชนไม่ถูกต้อง';
  if (!form.address || form.address.trim().length < 5) return 'กรุณากรอกที่อยู่';
  return '';
}

function TenantsPage({ status }) {
  const { data = [], loading, reload } = useApi('/tenants', { initialData: [] });
  const { data: tenantTypes = [] } = useApi('/tenant-types', { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tenantError, setTenantError] = useState('');
  const [editingTenant, setEditingTenant] = useState(null);
  const [form, setForm] = useState({ username: '', password: 'Vendor@123456', tenantTypeId: '', name: '', phone: '', email: '', idCard: '', address: '' });
  const [editForm, setEditForm] = useState({ username: '', password: '', tenantTypeId: '', name: '', phone: '', email: '', idCard: '', address: '', status: 'active' });
  const typeRows = normalizeRows(tenantTypes);
  const rows = normalizeRows(data).filter((item) => !status || item.status === status);

  function openCreateModal() {
    setTenantError('');
    setForm({ username: '', password: 'Vendor@123456', tenantTypeId: typeRows[0]?.id ? String(typeRows[0].id) : '', name: '', phone: '', email: '', idCard: '', address: '' });
    setModalOpen(true);
  }

  function openEditModal(tenant) {
    setTenantError('');
    setEditingTenant(tenant);
    setEditForm({
      username: tenant.username || '',
      password: '',
      tenantTypeId: tenant.tenant_type_id ? String(tenant.tenant_type_id) : '',
      name: tenant.name || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      idCard: tenant.id_card || '',
      address: tenant.address || '',
      status: tenant.status || 'active',
    });
    setEditModalOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    const validationError = validateTenantForm(form, 'create');
    if (validationError) {
      setTenantError(validationError);
      return;
    }
    await mutate('/tenants', { ...form, tenantTypeId: Number(form.tenantTypeId) });
    setForm({ username: '', password: 'Vendor@123456', tenantTypeId: '', name: '', phone: '', email: '', idCard: '', address: '' });
    setTenantError('');
    setModalOpen(false);
    reload();
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingTenant) return;
    const validationError = validateTenantForm(editForm, 'edit');
    if (validationError) {
      setTenantError(validationError);
      return;
    }
    await mutate(`/tenants/${editingTenant.id}`, { ...editForm, tenantTypeId: Number(editForm.tenantTypeId) }, 'PATCH');
    setTenantError('');
    setEditModalOpen(false);
    setEditingTenant(null);
    reload();
  }

  async function updateStatus(tenant, nextStatus) {
    await mutate(`/tenants/${tenant.id}/status`, { status: nextStatus }, 'PATCH');
    reload();
  }

  return (
    <>
      <PageHeader title={status === 'pending' ? 'ผู้เช่ารอการอนุมัติ' : 'รายชื่อผู้เช่า'} description="รายงานและจัดการข้อมูลผู้เช่าภายใต้องค์กร" action={<button onClick={openCreateModal} disabled={!typeRows.length} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><Plus size={16} /> เพิ่มผู้เช่า</button>} />
      {!typeRows.length ? <Card><div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">กรุณาสร้างประเภทสมาชิกในเมนู “ประเภทผู้เช่า” ก่อนเพิ่มผู้เช่า</div></Card> : null}
      <Card>{loading ? <LoadingBlock /> : <DataTable columns={['รหัส', 'Username', 'ชื่อผู้เช่า', 'ประเภทสมาชิก', 'โทรศัพท์', 'Email', 'สถานะ', 'จัดการ']} rows={rows.map((item) => [item.public_id, item.username || '-', item.name || '-', item.tenant_type_name || '-', item.phone || '-', item.email || '-', <StatusBadge value={item.status} />, <div className="flex gap-2"><SmallButton tone="amber" onClick={() => openEditModal(item)}>แก้ไข</SmallButton><SmallButton tone="cyan" onClick={() => updateStatus(item, 'active')}>อนุมัติ</SmallButton><SmallButton tone="red" onClick={() => updateStatus(item, 'suspended')}>ระงับ</SmallButton></div>])} />}</Card>
      <Modal open={modalOpen} title="เพิ่มผู้เช่า" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={tenantError || error}>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>Username</Label><TextInputBare value={form.username} onChange={(value) => setForm((current) => ({ ...current, username: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>Password</Label><TextInputBare value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>ประเภทสมาชิก</Label><select value={form.tenantTypeId} onChange={(event) => setForm((current) => ({ ...current, tenantTypeId: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"><option value="">เลือกประเภทสมาชิก</option>{typeRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>ชื่อผู้เช่า</Label><TextInputBare value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>เลขบัตรประชาชน</Label><TextInputBare value={form.idCard} onChange={(value) => setForm((current) => ({ ...current, idCard: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>อีเมล</Label><TextInputBare value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} type="email" /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>เบอร์โทร</Label><TextInputBare value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr]"><Label>ที่อยู่</Label><textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></div>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">บันทึกจากระบบจัดการจะตั้งสถานะเป็นอนุมัติอัตโนมัติ</div>
        </FormPanel>
      </Modal>
      <Modal open={editModalOpen} title="แก้ไขข้อมูลผู้เช่า" onClose={() => setEditModalOpen(false)}>
        <FormPanel onSubmit={submitEdit} loading={saving} error={tenantError || error}>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>Username</Label><TextInputBare value={editForm.username} onChange={(value) => setEditForm((current) => ({ ...current, username: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>Password ใหม่</Label><TextInputBare value={editForm.password} onChange={(value) => setEditForm((current) => ({ ...current, password: value }))} /><p className="text-xs text-slate-500">ปล่อยว่างถ้าไม่ต้องการเปลี่ยนรหัสผ่าน</p></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>ประเภทสมาชิก</Label><select value={editForm.tenantTypeId} onChange={(event) => setEditForm((current) => ({ ...current, tenantTypeId: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"><option value="">เลือกประเภทสมาชิก</option>{typeRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>ชื่อผู้เช่า</Label><TextInputBare value={editForm.name} onChange={(value) => setEditForm((current) => ({ ...current, name: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>เลขบัตรประชาชน</Label><TextInputBare value={editForm.idCard} onChange={(value) => setEditForm((current) => ({ ...current, idCard: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>อีเมล</Label><TextInputBare value={editForm.email} onChange={(value) => setEditForm((current) => ({ ...current, email: value }))} type="email" /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>เบอร์โทร</Label><TextInputBare value={editForm.phone} onChange={(value) => setEditForm((current) => ({ ...current, phone: value }))} /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr]"><Label>ที่อยู่</Label><textarea value={editForm.address} onChange={(event) => setEditForm((current) => ({ ...current, address: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>สถานะใช้งาน</Label><select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"><option value="active">อนุมัติแล้ว</option><option value="pending">รออนุมัติ</option><option value="suspended">ระงับ</option><option value="deleted">ยกเลิก</option></select></div>
        </FormPanel>
      </Modal>
    </>
  );
}

function PdpaPage() {
  const { data = {}, loading, reload } = useApi('/pdpa', { initialData: {} });
  const { mutate, loading: saving, error } = useMutation();
  const [form, setForm] = useState({ title: 'PDPA Consent', content: '', status: 'active' });

  useEffect(() => {
    setForm({ title: data?.title || 'PDPA Consent', content: data?.content || '', status: data?.status || 'active' });
  }, [data]);

  async function submit(event) {
    event.preventDefault();
    await mutate('/pdpa', form, 'PUT');
    reload();
  }

  return (
    <>
      <PageHeader title="จัดการ PDPA" description="จัดการข้อความ Consent PDPA ภายใต้องค์กร" />
      <Card>{loading ? <LoadingBlock /> : (
        <FormPanel onSubmit={submit} loading={saving} error={error}>
          <TextInput label="หัวข้อ" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-600">รายละเอียด PDPA</span><textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={14} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'เปิดใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
      )}</Card>
    </>
  );
}

function BookingsPage({ marketId, mode }) {
  const { data = [], loading } = useApi(marketId ? `/markets/${marketId}/bookings` : null, { initialData: [] });
  const { data: users = [] } = useApi('/mobile-users', { initialData: [] });
  const { data: booths = [] } = useApi(marketId ? `/markets/${marketId}/booths` : null, { initialData: [] });
  const { data: products = [] } = useApi(marketId ? `/markets/${marketId}/products` : null, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ mobileUserId: '', boothId: '', bookingDate: '2026-05-14', productId: '' });
  const rows = normalizeRows(data);
  const userRows = normalizeRows(users);
  const boothRows = normalizeRows(booths);
  const productRows = normalizeRows(products);
  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/bookings`, {
      mobileUserId: Number(form.mobileUserId || userRows[0]?.id),
      items: [{ boothId: Number(form.boothId || boothRows[0]?.id), bookingDate: form.bookingDate, productIds: form.productId ? [Number(form.productId)] : [] }],
    });
    setModalOpen(false);
  }

  return (
    <>
      <PageHeader
        title={mode === 'edit' ? 'แก้ไขการจอง' : mode === 'history' ? 'รายการแก้ไขการจอง' : 'การจอง'}
        description="จัดการรายการจองพื้นที่"
        action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> จองแทนสมาชิก</button>}
      />
      <div className="grid gap-6">
        <Card>{loading ? <LoadingBlock /> : <DataTable columns={['เลขที่', 'สถานะ', 'ยอดรวม', 'แหล่งที่มา', 'จำนวนรายการ', 'วันที่สร้าง']} rows={rows.map((booking) => [booking.public_id, <StatusBadge value={booking.status} />, formatMoney(booking.total_amount), booking.source, booking.item_count, formatDate(booking.created_at)])} />}</Card>
        <Modal open={modalOpen} title="สร้างการจองแทนลูกค้า" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={error}>
          <SelectInput label="ผู้จอง" value={form.mobileUserId || userRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, mobileUserId: value }))} options={userRows.map((item) => [String(item.id), `${item.public_id || 'User'} (#${item.id})`])} />
          <SelectInput label="Booth" value={form.boothId || boothRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, boothId: value }))} options={boothRows.map((item) => [String(item.id), `${item.code || item.name} - ${formatMoney(item.price)}`])} />
          <DatePicker label="วันที่จอง" value={form.bookingDate} onChange={(value) => setForm((current) => ({ ...current, bookingDate: value }))} required />
          <SelectInput label="สินค้า" value={form.productId} onChange={(value) => setForm((current) => ({ ...current, productId: value }))} options={[['', 'ไม่ระบุ'], ...productRows.map((item) => [String(item.id), item.name])]} />
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

function ReportsPage() {
  const [range, setRange] = useState({ startDate: '2026-05-01', endDate: '2026-05-31' });
  const path = `/reports/bookings?startDate=${range.startDate}&endDate=${range.endDate}`;
  const { data = [], loading, reload } = useApi(path, { initialData: [] });
  return (
    <>
      <PageHeader title="Report" description="รายงานการจองและรายได้" action={<div className="flex gap-2"><DatePickerBare value={range.startDate} onChange={(value) => setRange((current) => ({ ...current, startDate: value }))} /><DatePickerBare value={range.endDate} onChange={(value) => setRange((current) => ({ ...current, endDate: value }))} /><button onClick={reload} className="rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">ค้นหา</button></div>} />
      <Card>{loading ? <LoadingBlock /> : <ReportTable rows={normalizeRows(data)} />}</Card>
    </>
  );
}

function AuditPage({ marketId }) {
  const { data = [], loading } = useApi(marketId ? `/markets/${marketId}/audit-checks` : null, { initialData: [] });
  if (!marketId) return <NeedMarket />;
  return (
    <>
      <PageHeader title="ตรวจสอบตลาด" description="รายการตรวจสอบและผลการตรวจตลาด" />
      <Card>{loading ? <LoadingBlock /> : <DataTable columns={['เลขจอง', 'Booth', 'วันที่จอง', 'ผลตรวจ', 'ค่าปรับ', 'ผู้ตรวจ', 'วันที่ตรวจ']} rows={normalizeRows(data).map((item) => [item.booking_public_id, item.booth_name, formatDate(item.booking_date), <StatusBadge value={item.result} />, formatMoney(item.total_fine_amount), item.checked_by_name || '-', formatDate(item.checked_at)])} />}</Card>
    </>
  );
}

function AccountingPage() {
  const { data = [], loading } = useApi('/accounting/payments', { initialData: [] });
  return (
    <>
      <PageHeader title="บัญชี" description="รายการชำระเงินทั้งหมด" />
      <Card>{loading ? <LoadingBlock /> : <DataTable columns={['เลขชำระเงิน', 'เลขจอง', 'Provider', 'สถานะ', 'จำนวนเงิน', 'วันที่']} rows={normalizeRows(data).map((payment) => [payment.public_id, payment.booking_public_id || '-', payment.provider, <StatusBadge value={payment.status} />, formatMoney(payment.amount), formatDate(payment.paid_at || payment.created_at)])} />}</Card>
    </>
  );
}

function AdminsPage({ marketId }) {
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const { mutate, loading, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const marketRows = normalizeRows(markets);
  const [form, setForm] = useState({ username: '', password: 'Admin@123456', role: 'admin', name: '', email: '', phone: '', marketId: String(marketId || '') });
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    const marketIds = form.role === 'accounting' || form.role === 'supervisor' ? [] : [Number(form.marketId || marketRows[0]?.id)].filter(Boolean);
    await mutate('/admins', { ...form, marketIds });
    setMessage('สร้างผู้ดูแลระบบสำเร็จ');
    setModalOpen(false);
    setForm((current) => ({ ...current, username: '', name: '', email: '', phone: '' }));
  }

  return (
    <>
      <PageHeader title="ผู้ดูแลระบบ" description="สร้างบัญชีผู้ดูแลและกำหนดสิทธิ์ตลาด" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มผู้ดูแล</button>} />
      <div className="grid gap-6">
        <Modal open={modalOpen} title="เพิ่มผู้ดูแล" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={loading} error={error}>
          {message ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          <TextInput label="Username" value={form.username} onChange={(value) => setForm((current) => ({ ...current, username: value }))} required />
          <TextInput label="Password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} required />
          <SelectInput label="Role" value={form.role} onChange={(value) => setForm((current) => ({ ...current, role: value }))} options={[['admin', 'admin'], ['supervisor', 'supervisor'], ['accounting', 'accounting'], ['audit', 'audit']]} />
          <TextInput label="ชื่อ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <TextInput label="Phone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          {['admin', 'audit'].includes(form.role) ? (
            <SelectInput label="ตลาดที่รับผิดชอบ" value={form.marketId || marketRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, marketId: value }))} options={marketRows.map((item) => [String(item.id), item.name])} />
          ) : null}
        </FormPanel>
        </Modal>
        <Card>
          <SectionTitle title="คำอธิบาย Role" description="ใช้สำหรับกำหนดสิทธิ์การเข้าถึงเมนูหลัก" icon={ShieldIcon} />
          <div className="grid gap-3 sm:grid-cols-2">
            <RoleCard role="supervisor" description="ดูภาพรวม จัดการตลาด รายงาน และบัญชี" />
            <RoleCard role="admin" description="จัดการตลาด บูธ สินค้า คูปอง และการจอง" />
            <RoleCard role="accounting" description="ดูรายการชำระเงินและบัญชี" />
            <RoleCard role="audit" description="ตรวจสอบตลาดและรายการจอง" />
          </div>
        </Card>
      </div>
    </>
  );
}

function ShieldIcon(props) {
  return <Settings {...props} />;
}

function RoleCard({ role, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-bold text-slate-950">{role}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function ReportTable({ rows }) {
  return <DataTable columns={['ตลาด', 'สถานะ', 'จำนวนการจอง', 'รายได้รวม']} rows={rows.map((row) => [row.market_name, <StatusBadge value={row.status || 'success'} />, row.booking_count, formatMoney(row.total_amount)])} />;
}

function PaymentList({ rows }) {
  if (!rows?.length) return <EmptyState />;
  return (
    <div className="space-y-3">
      {rows.slice(0, 8).map((payment) => (
        <div key={payment.id || payment.public_id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
          <div>
            <p className="font-bold text-slate-950">{payment.public_id}</p>
            <p className="text-sm text-slate-500">{payment.provider} · {formatDate(payment.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-950">{formatMoney(payment.amount)}</p>
            <StatusBadge value={payment.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Toolbar({ keyword, onKeyword }) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500">Show <select className="rounded-xl border border-slate-200 px-3 py-2"><option>10</option><option>25</option></select> entries</div>
      <label className="relative block sm:w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={keyword} onChange={(event) => onKeyword(event.target.value)} placeholder="Search" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-600" />
      </label>
    </div>
  );
}

function DataTable({ columns, rows }) {
  if (!rows?.length) return <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 first:rounded-l-xl last:rounded-r-xl">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="transition hover:bg-slate-50">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="border-b border-slate-100 px-4 py-4 align-middle text-slate-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormPanel({ title, children, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {title ? <h2 className="mb-5 text-lg font-extrabold text-slate-950">{title}</h2> : null}
      {children}
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <button disabled={loading} className="h-11 w-full rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60">
        {loading ? 'กำลังบันทึก...' : 'บันทึก'}
      </button>
    </form>
  );
}

function Label({ children }) {
  return <span className="text-sm font-bold text-slate-600">{children}</span>;
}

function TextInput({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <TextInputBare value={value} onChange={onChange} type={type} required={required} />
    </label>
  );
}

function TextInputBare({ value, onChange, type = 'text', required = false }) {
  return <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />;
}

function DatePicker({ label, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <DatePickerBare value={value} onChange={onChange} required={required} />
    </label>
  );
}

function DatePickerBare({ value, onChange, required = false }) {
  return <input type="date" value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />;
}

function TimePicker({ label, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <input type="time" value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
    </label>
  );
}

function DateTimePicker({ label, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <input type="datetime-local" value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
    </label>
  );
}

function FileInput({ label, onChange, multiple = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        onChange={(event) => onChange(multiple ? Array.from(event.target.files || []) : event.target.files?.[0] || null)}
        className="block w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-cyan-700 hover:border-cyan-400"
      />
    </label>
  );
}

function FileSummary({ file }) {
  if (!file) return null;
  return <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">เลือกแล้ว {file.name}</div>;
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function SmallButton({ children, tone = 'slate', onClick }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-100',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100',
  };
  return <button type="button" onClick={onClick} className={classNames('inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition', tones[tone])}>{children}</button>;
}

function OutlineButton({ children, tone = 'amber' }) {
  const tones = {
    cyan: 'border-cyan-300 text-cyan-700 hover:bg-cyan-50',
    amber: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    red: 'border-red-300 text-red-700 hover:bg-red-50',
  };
  return <button type="button" className={classNames('inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition', tones[tone])}>{children}</button>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
    </Routes>
  );
}
