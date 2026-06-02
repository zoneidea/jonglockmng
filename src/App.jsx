import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import qrcode from 'qrcode-generator';
import {
  BadgeCheck,
  BarChart3,
  Bold,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Heading1,
  Image,
  ImagePlus,
  Italic,
  LayoutDashboard,
  Link2,
  List,
  ListOrdered,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  Package,
  Percent,
  Plus,
  Printer,
  Redo2,
  Search,
  Settings,
  Share2,
  Store,
  TicketCheck,
  Type,
  Underline,
  Undo2,
  UserCheck,
  Users,
  Utensils,
  Warehouse,
  X,
} from 'lucide-react';
import { API_BASE_URL, MARKET_DEEP_LINK_BASE_URL, request } from './api/client.js';
import { menu } from './app/navigation.jsx';
import { BookingDateSummary } from './components/BookingDateSummary.jsx';
import { Card } from './components/Card.jsx';
import { DataTable } from './components/DataTable.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { LoadingBlock } from './components/LoadingBlock.jsx';
import { PageLoadingFallback } from './components/PageLoadingFallback.jsx';
import { PageHeader } from './components/PageHeader.jsx';
import { SectionTitle } from './components/SectionTitle.jsx';
import { Stat } from './components/Stat.jsx';
import { StatusBadge } from './components/StatusBadge.jsx';
import { useApi, useMutation } from './hooks/useApi.js';
import { useAuth } from './state/auth.jsx';
import { buildSubscriptionGate, resolveSubscriptionFeature, SubscriptionContext } from './state/subscription.jsx';
import jonglockLogoWhite from './assets/jonglock-logo-white.png';
import {
  DatePicker,
  DatePickerBare,
  DateTimePicker,
  FileInput,
  FileSummary,
  FormPanel,
  Label,
  Modal,
  NeedMarket,
  PasswordPolicyHint,
  ReportActionButton,
  ReportExportActions,
  ReportFiltersBar,
  SearchInput,
  SelectInput,
  SmallButton,
  TextInput,
  TextInputBare,
  filterRowsByKeyword,
  RichTextEditor,
} from './components/ManagementUi.jsx';
import {
  classNames,
  escapeHtml,
  formatBookingDateSummary,
  formatDate,
  formatMoney,
  normalizeRows,
  reportFileName,
} from './utils/formatters.js';
import { showAlert } from './utils/alerts.js';

const POWERED_BY_TEXT = 'Powered by zone-idea innovation co.,ltd.';
const REMEMBERED_LOGIN_KEY = 'jonglock.management.rememberedLogin';

function readLoginQueryPrefill() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      organizationCode: (params.get('organizationCode') || '').trim().toUpperCase(),
    };
  } catch {
    return { organizationCode: '' };
  }
}

function readRememberedLogin() {
  try {
    const raw = localStorage.getItem(REMEMBERED_LOGIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistRememberedLogin({ organizationCode, username }, rememberMe) {
  if (!rememberMe) {
    localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    return;
  }
  localStorage.setItem(
    REMEMBERED_LOGIN_KEY,
    JSON.stringify({
      organizationCode: organizationCode.trim().toUpperCase(),
      username: username.trim(),
    }),
  );
}

const lazyNamed = (loader, exportName) => lazy(() => loader().then((module) => ({ default: module[exportName] })));

const DashboardComponent = lazyNamed(() => import('./pages/Dashboard/index.js'), 'Dashboard');
const MarketsPage = lazyNamed(() => import('./pages/Markets/index.js'), 'MarketsPage');
const MarketInfoPage = lazyNamed(() => import('./pages/Markets/index.js'), 'MarketInfoPage');
const BoothTypesPage = lazyNamed(() => import('./pages/Markets/index.js'), 'BoothTypesPage');
const BoothsPage = lazyNamed(() => import('./pages/Markets/index.js'), 'BoothsPage');
const HolidayCalendarPage = lazyNamed(() => import('./pages/Markets/index.js'), 'HolidayCalendarPage');
const MarketImagesPage = lazyNamed(() => import('./pages/Markets/index.js'), 'MarketImagesPage');
const AccessoriesPage = lazyNamed(() => import('./pages/Markets/index.js'), 'AccessoriesPage');
const ProductCategoriesPage = lazyNamed(() => import('./pages/Products/index.js'), 'ProductCategoriesPage');
const ProductGroupsPage = lazyNamed(() => import('./pages/Products/index.js'), 'ProductGroupsPage');
const ProductsPage = lazyNamed(() => import('./pages/Products/index.js'), 'ProductsPage');
const BookingsPage = lazyNamed(() => import('./pages/Bookings/index.js'), 'BookingsPage');
const PaymentProofReviewPage = lazyNamed(() => import('./pages/Bookings/index.js'), 'PaymentProofReviewPage');
const TenantTypesPage = lazyNamed(() => import('./pages/Bookings/index.js'), 'TenantTypesPage');
const TenantsPage = lazyNamed(() => import('./pages/Bookings/index.js'), 'TenantsPage');
const PdpaPage = lazyNamed(() => import('./pages/Bookings/index.js'), 'PdpaPage');
const ReportsPage = lazyNamed(() => import('./pages/Reports/index.js'), 'ReportsPage');
const SupportPage = lazyNamed(() => import('./pages/Support/index.js'), 'SupportPage');

function auditResultLabel(value) {
  const labels = {
    pass: 'ผ่านการประเมิน',
    warning: 'ตักเตือน',
    failed: 'ทำผิดกฎ',
  };
  return labels[String(value || '').toLowerCase()] || value || '-';
}

function accountingDocumentLabel(value) {
  const labels = {
    receipt: 'ใบเสร็จรับเงิน',
    tax_invoice: 'ใบกำกับภาษี / ใบเสร็จรับเงิน',
    credit_note: 'ใบลดหนี้',
  };
  return labels[String(value || '').toLowerCase()] || value || '-';
}

function receivableTypeLabel(value) {
  return value === 'fine' ? 'ค่าปรับ' : value === 'booking' ? 'ค่าจอง' : value || '-';
}

function paymentTypeLabel(value) {
  return value === 'audit_fine' ? 'ค่าปรับ' : 'ค่าบริการ';
}

function reconciliationLabel(value) {
  return value === 'matched' ? 'ตรงกัน' : 'ต้องตรวจสอบ';
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

function toDateInputValue(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function currentMonthFilterDates() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
    asOfDate: toDateInputValue(today),
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportReportExcel(title, columns, rows) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        h1 { font-size: 18px; margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; vertical-align: top; }
        th { background: #f8fafc; text-align: left; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <table>
        <thead>
          <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
  </html>`;
  downloadBlob(new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), reportFileName(title, 'xls'));
}

function openReportPrintWindow(title, columns, rows, mode = 'print') {
  const child = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
  if (!child) return;
  child.document.write(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
        h1 { font-size: 22px; margin: 0 0 12px; }
        p { margin: 0 0 18px; font-size: 12px; color: #475569; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; vertical-align: top; text-align: left; }
        th { background: #f8fafc; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <p>${mode === 'pdf' ? 'ระบบจะเปิดหน้าพิมพ์เพื่อให้บันทึกเป็น PDF' : 'ระบบจะเปิดหน้าพิมพ์รายงาน'}</p>
      <table>
        <thead>
          <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
  </html>`);
  child.document.close();
  child.focus();
  child.onload = () => child.print();
}

function openPaymentDocumentWindow(payment) {
  const document = payment.document || {};
  const organizationSnapshot = typeof document.organization_snapshot_json === 'string'
    ? JSON.parse(document.organization_snapshot_json || 'null') || {}
    : document.organization_snapshot_json || {};
  const customerSnapshot = typeof document.customer_snapshot_json === 'string'
    ? JSON.parse(document.customer_snapshot_json || 'null') || {}
    : document.customer_snapshot_json || {};
  const lineItems = typeof document.line_items_json === 'string'
    ? JSON.parse(document.line_items_json || '[]') || []
    : document.line_items_json || [];
  const documentType = document.document_type || payment.document_type || (Number(payment.vat_enabled || 0) === 1 ? 'tax_invoice' : 'receipt');
  const isTaxInvoice = documentType === 'tax_invoice';
  const isCreditNote = documentType === 'credit_note';
  const title = isCreditNote ? 'ใบลดหนี้' : isTaxInvoice ? 'ใบกำกับภาษี / ใบเสร็จรับเงิน' : 'ใบเสร็จรับเงิน';
  const organizationName = isTaxInvoice ? organizationSnapshot.registeredName || payment.registered_name || payment.organization_name : organizationSnapshot.name || payment.organization_name;
  const organizationAddress = [
    organizationSnapshot.address || payment.organization_address,
    organizationSnapshot.registeredSubdistrict || payment.registered_subdistrict,
    organizationSnapshot.registeredDistrict || payment.registered_district,
    organizationSnapshot.registeredProvince || payment.registered_province,
    organizationSnapshot.registeredPostcode || payment.registered_postcode,
  ].filter(Boolean).join(' ');
  const documentNo = document.document_no || payment.document_no || payment.public_id || '-';
  const issueDate = document.issue_date || payment.paid_at || payment.created_at;
  const subtotalAmount = document.subtotal_amount ?? payment.subtotal_amount ?? 0;
  const discountAmount = document.discount_amount ?? payment.discount_amount ?? 0;
  const vatAmount = document.vat_amount ?? payment.vat_amount ?? 0;
  const totalAmount = document.total_amount ?? payment.amount ?? payment.total_amount ?? 0;
  const displayLineItems = lineItems.length ? lineItems : [{ description: 'ค่าจอง Booth', detail: payment.booths || '-', amount: subtotalAmount }];
  const child = window.open('', '_blank', 'noopener,noreferrer,width=960,height=1200');
  if (!child) return;
  child.document.write(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)} ${escapeHtml(documentNo)}</title>
      <style>
        body { margin: 0; background: #e2e8f0; color: #0f172a; font-family: Arial, Tahoma, sans-serif; }
        .sheet { width: 794px; min-height: 1123px; margin: 24px auto; background: white; padding: 48px; box-sizing: border-box; box-shadow: 0 20px 50px rgba(15,23,42,.18); }
        .top { display: flex; justify-content: space-between; gap: 32px; border-bottom: 3px solid #0f172a; padding-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; margin: 0 0 8px; }
        .muted { color: #64748b; font-size: 12px; line-height: 1.7; }
        .doc-title { text-align: right; }
        .doc-title h1 { margin: 0; font-size: 28px; }
        .badge { display: inline-block; margin-top: 8px; border-radius: 999px; background: #ecfeff; color: #0e7490; padding: 6px 12px; font-size: 12px; font-weight: 700; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; }
        .box { border: 1px solid #cbd5e1; border-radius: 14px; padding: 18px; }
        .box h2 { margin: 0 0 12px; font-size: 14px; color: #334155; }
        .line { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 28px; }
        th { background: #0f172a; color: white; text-align: left; font-size: 12px; padding: 12px; }
        td { border-bottom: 1px solid #e2e8f0; padding: 12px; font-size: 13px; vertical-align: top; }
        .right { text-align: right; }
        .totals { width: 330px; margin-left: auto; margin-top: 22px; }
        .total-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .grand { font-size: 18px; font-weight: 800; border-bottom: 0; color: #0f172a; }
        .footer { margin-top: 56px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
        .sign { border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; font-size: 12px; color: #475569; }
        @media print { body { background: white; } .sheet { margin: 0; box-shadow: none; width: auto; min-height: auto; } }
      </style>
    </head>
    <body>
      <main class="sheet">
        <section class="top">
          <div>
            <p class="brand">${escapeHtml(organizationName || '-')}</p>
            <div class="muted">
              ${escapeHtml(organizationAddress || '-')}<br/>
              ${organizationSnapshot.phone || payment.organization_phone ? `โทร ${escapeHtml(organizationSnapshot.phone || payment.organization_phone)} ` : ''}${organizationSnapshot.email || payment.organization_email ? `อีเมล ${escapeHtml(organizationSnapshot.email || payment.organization_email)}` : ''}<br/>
              ${isTaxInvoice ? `เลขประจำตัวผู้เสียภาษี ${escapeHtml(organizationSnapshot.registeredTaxId || payment.registered_tax_id || '-')}` : ''}
            </div>
          </div>
          <div class="doc-title">
            <h1>${escapeHtml(title)}</h1>
            <span class="badge">${isCreditNote ? 'CREDIT NOTE' : isTaxInvoice ? `VAT ${escapeHtml(organizationSnapshot.vatRate || payment.vat_rate || 7)}%` : 'NON VAT'}</span>
          </div>
        </section>
        <section class="grid">
          <div class="box">
            <h2>ข้อมูลลูกค้า</h2>
            <div class="line"><span>ชื่อลูกค้า</span><strong>${escapeHtml(document.customer_name || payment.customer_name || customerSnapshot.name || '-')}</strong></div>
            <div class="line"><span>ตลาด</span><strong>${escapeHtml(payment.market_name || customerSnapshot.marketName || '-')}</strong></div>
            <div class="line"><span>วันที่จอง</span><strong>${escapeHtml(payment.booking_dates || customerSnapshot.bookingDates || '-')}</strong></div>
          </div>
          <div class="box">
            <h2>ข้อมูลเอกสาร</h2>
            <div class="line"><span>เลขที่เอกสาร</span><strong>${escapeHtml(documentNo)}</strong></div>
            <div class="line"><span>เลขที่ใบจอง</span><strong>${escapeHtml(payment.booking_public_id || customerSnapshot.bookingPublicId || '-')}</strong></div>
            <div class="line"><span>วันที่เอกสาร</span><strong>${escapeHtml(formatDate(issueDate))}</strong></div>
          </div>
        </section>
        <table>
          <thead><tr><th>รายการ</th><th>รายละเอียด</th><th class="right">จำนวนเงิน</th></tr></thead>
          <tbody>
            ${displayLineItems.map((item) => `<tr><td>${escapeHtml(item.description || '-')}</td><td>${escapeHtml(item.detail || '-')}</td><td class="right">${escapeHtml(formatMoney(item.amount || 0))}</td></tr>`).join('')}
          </tbody>
        </table>
        <section class="totals">
          <div class="total-row"><span>ยอดก่อนส่วนลด</span><strong>${escapeHtml(formatMoney(subtotalAmount))}</strong></div>
          <div class="total-row"><span>ส่วนลด</span><strong>${escapeHtml(formatMoney(discountAmount))}</strong></div>
          <div class="total-row"><span>VAT</span><strong>${escapeHtml(formatMoney(vatAmount))}</strong></div>
          <div class="total-row grand"><span>ยอดสุทธิ</span><strong>${escapeHtml(formatMoney(totalAmount))}</strong></div>
        </section>
        <section class="footer">
          <div class="sign">ผู้รับเงิน</div>
          <div class="sign">ผู้มีอำนาจลงนาม</div>
        </section>
      </main>
      <script>window.onload = () => window.print();</script>
    </body>
  </html>`);
  child.document.close();
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const rememberedLogin = useMemo(readRememberedLogin, []);
  const loginPrefill = useMemo(readLoginQueryPrefill, []);
  const [form, setForm] = useState({
    organizationCode: loginPrefill.organizationCode || rememberedLogin?.organizationCode || '',
    username: rememberedLogin?.username || '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedLogin?.organizationCode || rememberedLogin?.username));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const nextLogin = {
        organizationCode: form.organizationCode.trim().toUpperCase(),
        username: form.username.trim(),
      };
      await login(nextLogin.organizationCode, nextLogin.username, form.password, rememberMe);
      persistRememberedLogin(nextLogin, rememberMe);
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
            <h1 className="whitespace-nowrap text-4xl font-extrabold leading-tight md:text-5xl xl:text-6xl">ระบบจัดการตลาดและพื้นที่ขาย</h1>
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
          <form onSubmit={handleSubmit} autoComplete="off" className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Market Operations</p>
            <h2 className="mt-2 text-2xl font-bold">เข้าสู่ระบบจัดการ</h2>
            <p className="mt-2 text-sm text-slate-500">ใช้บัญชี supervisor, admin หรือ accounting</p>
            <div className="mt-8 space-y-4">
              <TextInput label="รหัสองค์กร" value={form.organizationCode} onChange={(value) => setForm((current) => ({ ...current, organizationCode: value }))} autoComplete="off" required />
              <TextInput label="Username" value={form.username} onChange={(value) => setForm((current) => ({ ...current, username: value }))} autoComplete="off" required />
              <TextInput label="Password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} type="password" autoComplete="new-password" required />
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50/40">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600"
              />
              <span className="flex-1">Remember me</span>
              <span className="text-xs font-medium text-slate-400">
                {rememberMe ? 'เก็บ session ไว้ในเครื่องนี้' : 'อยู่จนกว่าจะปิดแท็บ'}
              </span>
            </label>
            {error ? <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
            <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{POWERED_BY_TEXT}</p>
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
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscriptionNotice, setSubscriptionNotice] = useState('');
  const canLoadMarkets = ['supervisor', 'admin', 'accounting'].includes(user?.role);
  const { data: markets = [], loading: marketsLoading, reload: reloadMarkets } = useApi(canLoadMarkets ? '/markets' : null, {
    initialData: [],
    skip: !canLoadMarkets,
  });
  const { data: subscription = null, loading: subscriptionLoading } = useApi('/subscription/current', {
    initialData: null,
  });
  const marketRows = normalizeRows(markets);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const currentMarketId = selectedMarketId || marketRows?.[0]?.id || '';
  const currentMarket = marketRows.find((market) => String(market.id) === String(currentMarketId)) || marketRows?.[0] || null;
  const featureKey = resolveSubscriptionFeature(location.pathname);
  const subscriptionGate = buildSubscriptionGate(subscription, featureKey);
  const subscriptionContextValue = useMemo(() => ({
    subscription,
    featureKey,
    subscriptionLoading,
    ...subscriptionGate,
  }), [subscription, featureKey, subscriptionLoading, subscriptionGate.actionBlocked, subscriptionGate.blockedMessage]);

  const availableMenu = useMemo(() => {
    const allowed = new Set([...(user?.menus || []), 'dashboard']);
    const subscriptionAllows = (path) => {
      if (!subscription || subscription.fullFunction || subscription.plan?.isFullFunction) return true;
      const nextFeatureKey = resolveSubscriptionFeature(path);
      if (nextFeatureKey === 'dashboard') return true;
      return subscription.entitlements?.[nextFeatureKey]?.enabled !== false && Boolean(subscription.entitlements?.[nextFeatureKey]);
    };

    return menu
      .map((item) => {
        const roleAllowed = allowed.has(item.menuKey) || item.roles?.includes(user?.role);
        if (!roleAllowed) return null;
        if (item.children?.length) {
          const children = item.children.filter((child) => subscriptionAllows(child.path || item.path || '/'));
          return children.length ? { ...item, children } : null;
        }
        return subscriptionAllows(item.path || '/') ? item : null;
      })
      .filter(Boolean);
  }, [subscription, user]);

  function handleMainClickCapture(event) {
    if (!subscriptionContextValue.actionBlocked) return;
    const button = event.target.closest?.('button');
    if (!button || button.dataset.subscriptionIgnore === 'true') return;
    event.preventDefault();
    event.stopPropagation();
    setSubscriptionNotice(subscriptionContextValue.blockedMessage);
  }

  return (
    <SubscriptionContext.Provider value={subscriptionContextValue}>
      <div className="min-h-screen bg-slate-100">
        <Sidebar items={availableMenu} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:pl-72">
          <Topbar
            user={user}
            markets={marketRows}
            currentMarketId={currentMarketId}
            currentMarket={currentMarket}
            marketsLoading={marketsLoading}
            showMarketSelector={user?.role !== 'accounting'}
            subscription={subscription}
            subscriptionLoading={subscriptionLoading}
            onSelectMarket={setSelectedMarketId}
            onOpenSidebar={() => setSidebarOpen(true)}
            onLogout={logout}
          />
          <main
            onClickCapture={handleMainClickCapture}
            className={classNames('px-4 py-6 sm:px-6 lg:px-8', subscriptionContextValue.actionBlocked ? 'subscription-locked' : '')}
          >
            <SubscriptionNotice message={subscriptionNotice || subscriptionContextValue.blockedMessage} onDismiss={() => setSubscriptionNotice('')} persistent={subscriptionContextValue.actionBlocked} />
            <ErrorBoundary name="management-routes" resetKey={location.pathname} title="ไม่สามารถแสดงผลเมนูนี้ได้">
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<DashboardComponent marketId={currentMarketId} markets={marketRows} />} />
                  <Route path="/markets" element={<MarketsPage markets={marketRows} reloadMarkets={reloadMarkets} />} />
                  <Route path="/market-info" element={<MarketInfoPage marketId={currentMarketId} market={currentMarket} reloadMarkets={reloadMarkets} />} />
                  <Route path="/booth-types" element={<BoothTypesPage marketId={currentMarketId} />} />
                  <Route path="/booths" element={<BoothsPage marketId={currentMarketId} />} />
                  <Route path="/holidays" element={<Navigate to="/holiday-calendar" replace />} />
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
                  <Route path="/booking-payment-proofs" element={<PaymentProofReviewPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/report-booths" element={<ReportsPage reportType="booths" />} />
                  <Route path="/report-payments" element={<AccountingPage paidOnly />} />
                  <Route path="/report-daily" element={<ReportsPage reportType="daily" />} />
                  <Route path="/report-person" element={<ReportsPage reportType="person" />} />
                  <Route path="/audit" element={<AuditPage marketId={currentMarketId} />} />
                  <Route path="/audit-fines" element={<AuditPage marketId={currentMarketId} mode="fines" />} />
                  <Route path="/audit-fines-paid" element={<AuditPage marketId={currentMarketId} mode="paid" />} />
                  <Route path="/audit-defective" element={<AuditPage marketId={currentMarketId} mode="defective" />} />
                  <Route path="/announcements/news" element={<AnnouncementsPage type="news" />} />
                  <Route path="/tenant-types" element={<TenantTypesPage />} />
                  <Route path="/tenants" element={<TenantsPage />} />
                  <Route path="/tenants/pending" element={<TenantsPage status="pending" />} />
                  <Route path="/accounting" element={<AccountingAllReportPage />} />
                  <Route path="/accounting-payment-proofs" element={<Navigate to="/booking-payment-proofs" replace />} />
                  <Route path="/accounting-bookings" element={<ReportsPage reportType="accounting-bookings" />} />
                  <Route path="/accounting-payments" element={<AccountingPage />} />
                  <Route path="/accounting-summary" element={<AccountingSalesSummaryPage />} />
                  <Route path="/accounting-sap" element={<ReportsPage reportType="sap" />} />
                  <Route path="/accounting-documents" element={<AccountingStandardReportPage reportType="documents" />} />
                  <Route path="/accounting-tax-sales" element={<AccountingStandardReportPage reportType="tax-sales" />} />
                  <Route path="/accounting-receivables" element={<AccountingStandardReportPage reportType="receivables" />} />
                  <Route path="/accounting-reconciliation" element={<AccountingStandardReportPage reportType="reconciliation" />} />
                  <Route path="/accounting-refunds" element={<AccountingStandardReportPage reportType="refunds" />} />
                  <Route path="/accounting-product-types" element={<ReportsPage reportType="product-types" />} />
                  <Route path="/organization-settings" element={<OrganizationSettingsPage />} />
                  <Route path="/pdpa" element={<PdpaPage />} />
                  <Route path="/admins" element={<AdminsPage marketId={currentMarketId} />} />
                  <Route path="/support" element={<Navigate to="/support/tickets" replace />} />
                  <Route path="/support/tickets" element={<SupportPage mode="ticket" />} />
                  <Route path="/support/chat" element={<SupportPage mode="chat" />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            <p className="mt-10 pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{POWERED_BY_TEXT}</p>
          </main>
        </div>
      </div>
    </SubscriptionContext.Provider>
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
          <div className="flex min-w-0 items-center">
            <img src={jonglockLogoWhite} alt="Jonglock ระบบจองพื้นที่ขาย" className="h-12 w-auto max-w-[190px] object-contain" />
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10 lg:hidden"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

function Topbar({ user, markets, currentMarketId, currentMarket, marketsLoading, showMarketSelector, subscription, subscriptionLoading, onSelectMarket, onOpenSidebar, onLogout }) {
  const [shareOpen, setShareOpen] = useState(false);
  const endAt = subscription?.effectiveEndAt ? formatDate(subscription.effectiveEndAt) : '-';
  const statusText = subscriptionLoading
    ? 'กำลังโหลดแพ็คเกจ'
    : subscription?.plan?.name
      ? `${subscription.plan.name} · ${
        subscription.accessStatus === 'expired'
          ? 'หมดอายุ'
          : subscription.accessStatus === 'over_quota'
            ? 'เกินโควต้า'
            : `ใช้ได้ถึง ${endAt}`
      }`
      : 'ยังไม่มีแพ็คเกจ';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button data-subscription-ignore="true" onClick={onOpenSidebar} className="rounded-xl border border-slate-200 p-2 lg:hidden"><Menu size={20} /></button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold text-slate-950">ระบบจัดการตลาด</h1>
          <p className="text-xs text-slate-500">Role: {user?.role || '-'} · {statusText}</p>
        </div>
        {showMarketSelector && (marketsLoading || markets.length) ? (
          <select value={currentMarketId} onChange={(event) => onSelectMarket(event.target.value)} className="hidden h-11 min-w-64 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 sm:block">
            {marketsLoading ? <option>Loading...</option> : null}
            {markets.map((market) => (
              <option key={market.id} value={market.id}>{market.name}</option>
            ))}
          </select>
        ) : null}
        <button
          data-subscription-ignore="true"
          type="button"
          onClick={() => setShareOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
          title="แชร์"
          aria-label="แชร์"
        >
          <Share2 size={18} />
        </button>
        <button
          data-subscription-ignore="true"
          onClick={onLogout}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800"
          title="ออกจากระบบ"
          aria-label="ออกจากระบบ"
        >
          <LogOut size={18} />
        </button>
      </div>
      <ShareQrModal
        open={shareOpen}
        user={user}
        market={currentMarket}
        onClose={() => setShareOpen(false)}
      />
    </header>
  );
}

function ShareQrModal({ open, user, market, onClose }) {
  if (!open) return null;

  const deeplink = buildManagementShareDeeplink(user, market);
  const shareText = market?.name
    ? `เปิดดูตลาด ${market.name} บน Jonglock`
    : 'เปิด Jonglock';
  const encodedLink = encodeURIComponent(deeplink);
  const encodedText = encodeURIComponent(`${shareText}\n${deeplink}`);

  function openPopup(url) {
    window.open(url, '_blank', 'noopener,noreferrer,width=720,height=640');
  }

  function downloadQr() {
    const qr = qrcode(0, 'M');
    qr.addData(deeplink);
    qr.make();
    const moduleCount = qr.getModuleCount();
    const cellSize = 10;
    const quietZone = 4;
    const canvas = document.createElement('canvas');
    canvas.width = (moduleCount + quietZone * 2) * cellSize;
    canvas.height = canvas.width;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#07111f';
    for (let row = 0; row < moduleCount; row += 1) {
      for (let column = 0; column < moduleCount; column += 1) {
        if (qr.isDark(row, column)) {
          context.fillRect((column + quietZone) * cellSize, (row + quietZone) * cellSize, cellSize, cellSize);
        }
      }
    }
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `${market?.code || user?.organizationCode || 'jonglock'}-deeplink-qr.png`;
    anchor.click();
  }

  const dialog = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-6">
      <div className="my-auto flex max-h-[calc(100dvh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">แชร์ไปยังแอปฯ Jonglock</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">สแกนเพื่อเปิดตลาดนี้ในแอปฯ โดยตรง</p>
          </div>
          <button data-subscription-ignore="true" type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="ปิด">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="grid gap-5 md:grid-cols-[190px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
              <QrMatrix value={deeplink} />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-500">Deep link</p>
                <p className="mt-2 break-all rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{deeplink}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button data-subscription-ignore="true" type="button" onClick={() => openPopup(`https://social-plugins.line.me/lineit/share?url=${encodedLink}`)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white hover:bg-emerald-600">
                  <MessageCircle size={16} />
                  Line
                </button>
                <button data-subscription-ignore="true" type="button" onClick={() => openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
                  <Share2 size={16} />
                  Facebook
                </button>
                <a href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodedText}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 text-sm font-bold text-white hover:bg-slate-800">
                  <Mail size={16} />
                  Email
                </a>
                <button data-subscription-ignore="true" type="button" onClick={downloadQr} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white hover:bg-cyan-700">
                  <Download size={16} />
                  Download
                </button>
              </div>
              <p className="text-xs leading-5 text-slate-500">QR นี้ encode เป็น deep link สำหรับเปิดแอปฯ โดยตรง เมื่อแอปฯ รองรับ deep link route แล้วจะพาผู้ใช้ไปยังตลาด/องค์กรที่เลือกได้ทันที</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

function QrMatrix({ value }) {
  const matrix = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const moduleCount = qr.getModuleCount();
    return Array.from({ length: moduleCount }, (ignoredRowValue, row) =>
      Array.from({ length: moduleCount }, (ignoredColumnValue, column) => qr.isDark(row, column)),
    );
  }, [value]);

  return (
    <div className="mx-auto w-fit rounded-2xl bg-white p-2 shadow-sm">
      {matrix.map((row, rowIndex) => (
        <div key={`qr-row-${rowIndex}`} className="flex">
          {row.map((dark, columnIndex) => (
            <span key={`qr-cell-${rowIndex}-${columnIndex}`} className={classNames('h-[4px] w-[4px]', dark ? 'bg-slate-950' : 'bg-white')} />
          ))}
        </div>
      ))}
    </div>
  );
}

function buildManagementShareDeeplink(user, market) {
  const params = new URLSearchParams();
  if (user?.organizationCode) params.set('organizationCode', user.organizationCode);
  if (user?.organizationId) params.set('organizationId', String(user.organizationId));
  if (market?.id) params.set('marketId', String(market.id));
  if (market?.code) params.set('marketCode', market.code);
  return `${MARKET_DEEP_LINK_BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;
}

function SubscriptionNotice({ message, onDismiss, persistent = false }) {
  if (!message) return null;
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold">จำกัดการใช้งานตามแพ็คเกจ</p>
        <p className="mt-1">{message}</p>
      </div>
      {!persistent ? (
        <button data-subscription-ignore="true" type="button" onClick={onDismiss} className="h-9 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white">
          ปิด
        </button>
      ) : null}
    </div>
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
  const { token } = useAuth();
  const isNews = type === 'news';
  const title = type === 'banner' ? 'Banner' : 'ข่าวสาร';
  const { data = [], loading, reload } = useApi(`/announcements?type=${type}`, { initialData: [] });
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState({ marketId: '', title: '', description: '', startDate: '', endDate: '', status: 'active' });
  const [editForm, setEditForm] = useState({ marketId: '', title: '', description: '', startDate: '', endDate: '', status: 'active', coverImageId: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImages, setEditImages] = useState([]);
  const rows = normalizeRows(data);
  const marketOptions = [['', isNews ? 'เลือกตลาด' : 'ทุกตลาด / ไม่ระบุ']].concat(
    normalizeRows(markets).map((market) => [String(market.id), `${market.code} - ${market.name}`]),
  );

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append('type', type);
    if (form.marketId) payload.append('marketId', form.marketId);
    payload.append('title', form.title);
    payload.append('description', form.description);
    if (form.startDate) payload.append('startDate', form.startDate);
    if (form.endDate) payload.append('endDate', form.endDate);
    payload.append('status', form.status);
    if (isNews) {
      imageFiles.forEach((file) => payload.append('images', file));
    } else if (imageFile) {
      payload.append('image', imageFile);
    }
    await mutate('/announcements', payload);
    setForm({ marketId: '', title: '', description: '', startDate: '', endDate: '', status: 'active' });
    setImageFile(null);
    setImageFiles([]);
    setModalOpen(false);
    reload();
  }

  async function openEditModal(id) {
    setDetailLoading(true);
    setDetailError('');
    try {
      const payload = await request(`/announcements/${id}`, { token });
      const item = payload.data;
      setEditingAnnouncement(item);
      setEditForm({
        marketId: item.market_id ? String(item.market_id) : '',
        title: item.title || '',
        description: item.description || '',
        startDate: item.start_date ? String(item.start_date).slice(0, 10) : '',
        endDate: item.end_date ? String(item.end_date).slice(0, 10) : '',
        status: item.status || 'active',
        coverImageId: item.images?.find((image) => Number(image.is_cover) === 1)?.id ? String(item.images.find((image) => Number(image.is_cover) === 1).id) : '',
      });
      setEditImages(item.images || []);
      setEditImageFile(null);
      setEditImageFiles([]);
      setEditModalOpen(true);
    } catch (loadError) {
      setDetailError(loadError.message || 'โหลดรายละเอียดข่าวสารไม่สำเร็จ');
    } finally {
      setDetailLoading(false);
    }
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingAnnouncement) return;
    if (isNews && !editForm.marketId) {
      await showAlert({
        title: 'กรุณาเลือกตลาด',
        text: 'กรุณาเลือกตลาดสำหรับข่าวสาร',
        icon: 'warning',
      });
      return;
    }
    const payload = new FormData();
    if (editForm.marketId) payload.append('marketId', editForm.marketId);
    payload.append('title', editForm.title);
    payload.append('description', editForm.description);
    if (editForm.startDate) payload.append('startDate', editForm.startDate);
    if (editForm.endDate) payload.append('endDate', editForm.endDate);
    payload.append('status', editForm.status);
    if (isNews) {
      if (editForm.coverImageId) payload.append('coverImageId', editForm.coverImageId);
      editImageFiles.forEach((file) => payload.append('images', file));
    } else if (editImageFile) {
      payload.append('image', editImageFile);
    }
    await mutate(`/announcements/${editingAnnouncement.id}`, payload, 'PATCH');
    setEditModalOpen(false);
    setEditingAnnouncement(null);
    setEditImages([]);
    reload();
  }

  async function setCoverImage(imageId) {
    if (!editingAnnouncement) return;
    await mutate(`/announcements/${editingAnnouncement.id}/images/${imageId}/cover`, {}, 'PATCH');
    setEditImages((current) => current.map((image) => ({ ...image, is_cover: image.id === imageId ? 1 : 0 })));
    setEditForm((current) => ({ ...current, coverImageId: String(imageId) }));
    reload();
  }

  async function deleteImage(imageId) {
    if (!editingAnnouncement) return;
    await request(`/announcements/${editingAnnouncement.id}/images/${imageId}`, {
      method: 'DELETE',
      token,
    });
    const remaining = editImages.filter((image) => image.id !== imageId);
    setEditImages(remaining);
    const nextCover = remaining.find((image) => Number(image.is_cover) === 1)?.id || remaining[0]?.id || '';
    setEditForm((current) => ({ ...current, coverImageId: nextCover ? String(nextCover) : '' }));
    reload();
  }

  return (
    <>
      <PageHeader title={title} description="จัดการประกาศและประชาสัมพันธ์ภายใต้องค์กร" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่ม{title}</button>} />
      <Card>
        {loading ? <LoadingBlock /> : (
          <DataTable
            columns={['ลำดับ', 'รูปภาพ', 'ตลาด', 'หัวข้อ', 'ช่วงวันที่', 'สถานะ', 'จัดการ']}
            rows={rows.map((item, index) => [
              index + 1,
              item.image_url ? <img src={item.image_url} className="h-16 w-24 rounded-xl object-cover" /> : <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-slate-100"><Image size={20} /></div>,
              item.market_name ? (
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800">{item.market_name}</div>
                  <div className="text-xs font-semibold text-slate-500">{item.market_code || '-'}</div>
                </div>
              ) : <span className="text-sm font-semibold text-slate-400">ไม่ระบุ</span>,
              item.title,
              `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`,
              <StatusBadge value={item.status} />,
              <div className="flex gap-2"><SmallButton tone="amber" onClick={() => openEditModal(item.id)}>แก้ไข</SmallButton>{isNews ? <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">{item.image_count || 0} รูป</span> : null}</div>,
            ])}
          />
        )}
      </Card>
      <Modal open={modalOpen} title={`เพิ่ม${title}`} onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={error}>
          <SelectInput label="ตลาด" value={form.marketId} onChange={(value) => setForm((current) => ({ ...current, marketId: value }))} options={marketOptions} />
          <TextInput label="หัวข้อ" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
          {isNews ? (
            <RichTextEditor label="รายละเอียดข่าวสาร" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-600">รายละเอียด</span>
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={5} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" />
            </label>
          )}
          <FileInput label={isNews ? 'รูปภาพข่าวสาร' : 'รูปภาพ'} onChange={isNews ? setImageFiles : setImageFile} multiple={isNews} />
          {isNews ? (imageFiles.length ? <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">เลือกแล้ว {imageFiles.length} รูป</div> : null) : imageFile ? <FileSummary file={imageFile} /> : null}
          <DatePicker label="วันที่เริ่ม" value={form.startDate} onChange={(value) => setForm((current) => ({ ...current, startDate: value }))} />
          <DatePicker label="วันที่สิ้นสุด" value={form.endDate} onChange={(value) => setForm((current) => ({ ...current, endDate: value }))} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'เปิดใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
      </Modal>
      <Modal open={editModalOpen} title={`แก้ไข${title}`} onClose={() => setEditModalOpen(false)}>
        {detailLoading ? <LoadingBlock /> : (
          <FormPanel onSubmit={submitEdit} loading={saving} error={detailError || error}>
            <SelectInput label="ตลาด" value={editForm.marketId} onChange={(value) => setEditForm((current) => ({ ...current, marketId: value }))} options={marketOptions} />
            <TextInput label="หัวข้อ" value={editForm.title} onChange={(value) => setEditForm((current) => ({ ...current, title: value }))} required />
            {isNews ? (
              <RichTextEditor label="รายละเอียดข่าวสาร" value={editForm.description} onChange={(value) => setEditForm((current) => ({ ...current, description: value }))} />
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-600">รายละเอียด</span>
                <textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} rows={5} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" />
              </label>
            )}
            <FileInput label={isNews ? 'เพิ่มรูปภาพข่าวสาร' : 'รูปภาพใหม่'} onChange={isNews ? setEditImageFiles : setEditImageFile} multiple={isNews} />
            {isNews ? (editImageFiles.length ? <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">เลือกรูปเพิ่ม {editImageFiles.length} รูป</div> : null) : editImageFile ? <FileSummary file={editImageFile} /> : null}
            {isNews && editImages.length ? (
              <div className="space-y-3">
                <Label>รูปภาพข่าวสารเดิม</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {editImages.map((image) => (
                    <div key={image.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <img src={image.image_url} className="h-36 w-full rounded-xl object-cover" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <SmallButton tone={Number(image.is_cover) === 1 ? 'cyan' : 'slate'} onClick={() => setCoverImage(image.id)}>
                          {Number(image.is_cover) === 1 ? 'รูปหน้าปก' : 'ตั้งเป็นหน้าปก'}
                        </SmallButton>
                        <SmallButton tone="red" onClick={() => deleteImage(image.id)}>ลบรูป</SmallButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <DatePicker label="วันที่เริ่ม" value={editForm.startDate} onChange={(value) => setEditForm((current) => ({ ...current, startDate: value }))} />
            <DatePicker label="วันที่สิ้นสุด" value={editForm.endDate} onChange={(value) => setEditForm((current) => ({ ...current, endDate: value }))} />
            <SelectInput label="สถานะ" value={editForm.status} onChange={(value) => setEditForm((current) => ({ ...current, status: value }))} options={[['active', 'เปิดใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
          </FormPanel>
        )}
      </Modal>
    </>
  );
}

function OrganizationSettingsPage() {
  const { data = {}, loading, reload } = useApi('/organization-settings', { initialData: {} });
  const { mutate, loading: saving, error } = useMutation();
  const [formError, setFormError] = useState('');
  const [paymentQrCodeImage, setPaymentQrCodeImage] = useState(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    lineId: '',
    vatEnabled: false,
    vatRate: '7',
    registeredName: '',
    registeredTaxId: '',
    registeredSubdistrict: '',
    registeredDistrict: '',
    registeredProvince: '',
    registeredPostcode: '',
    paymentPromptpayId: '',
    paymentBankName: '',
    paymentBankAccountName: '',
    paymentBankAccountNo: '',
    paymentInstructions: '',
  });

  useEffect(() => {
    setForm({
      name: data?.name || '',
      address: data?.address || '',
      email: data?.email || '',
      phone: data?.phone || '',
      lineId: data?.line_id || '',
      vatEnabled: Number(data?.vat_enabled || 0) === 1,
      vatRate: String(data?.vat_rate ?? '7'),
      registeredName: data?.registered_name || '',
      registeredTaxId: data?.registered_tax_id || '',
      registeredSubdistrict: data?.registered_subdistrict || '',
      registeredDistrict: data?.registered_district || '',
      registeredProvince: data?.registered_province || '',
      registeredPostcode: data?.registered_postcode || '',
      paymentPromptpayId: data?.payment_promptpay_id || '',
      paymentBankName: data?.payment_bank_name || '',
      paymentBankAccountName: data?.payment_bank_account_name || '',
      paymentBankAccountNo: data?.payment_bank_account_no || '',
      paymentInstructions: data?.payment_instructions || '',
    });
    setPaymentQrCodeImage(null);
  }, [data]);

  async function submit(event) {
    event.preventDefault();
    setFormError('');
    if (form.vatEnabled) {
      const requiredFields = [
        form.vatRate,
        form.registeredName,
        form.registeredTaxId,
        form.registeredSubdistrict,
        form.registeredDistrict,
        form.registeredProvince,
        form.registeredPostcode,
      ];
      if (requiredFields.some((value) => String(value || '').trim() === '') || Number(form.vatRate) <= 0) {
        setFormError('กรุณากรอกข้อมูล VAT ให้ครบถ้วน');
        return;
      }
    }
    const payload = paymentQrCodeImage ? new FormData() : { ...form, vatRate: Number(form.vatRate || 0) };
    if (paymentQrCodeImage) {
      Object.entries({ ...form, vatRate: Number(form.vatRate || 0) }).forEach(([key, value]) => {
        payload.append(key, value ?? '');
      });
      payload.append('paymentQrCodeImage', paymentQrCodeImage);
    }
    await mutate('/organization-settings', payload, 'PUT');
    setPaymentQrCodeImage(null);
    reload();
  }

  return (
    <>
      <PageHeader title="ตั้งค่าองค์กร" description="กำหนดชื่อองค์กรและข้อมูลติดต่อหลักของบริษัทหรือองค์การ" />
      <Card>{loading ? <LoadingBlock /> : (
        <FormPanel onSubmit={submit} loading={saving} error={formError || error}>
          <TextInput label="ชื่อบริษัทหรือองค์การ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="อีเมล" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <TextInput label="โทรศัพท์" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          <TextInput label="Line ID" value={form.lineId} onChange={(value) => setForm((current) => ({ ...current, lineId: value }))} />
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-600">ที่อยู่</span><textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-extrabold text-slate-800">คิด VAT สำหรับองค์กรนี้</span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">เมื่อเปิดใช้งาน ระบบจะคำนวณ VAT ในราคาบูธ ยอดจอง และค่าปรับใหม่ทั้งหมด</span>
              </span>
              <input type="checkbox" checked={form.vatEnabled} onChange={(event) => setForm((current) => ({ ...current, vatEnabled: event.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
            </label>
          </div>
          {form.vatEnabled ? (
            <div className="grid gap-4 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 md:grid-cols-2">
              <TextInput label="อัตรา VAT (%)" type="number" value={form.vatRate} onChange={(value) => setForm((current) => ({ ...current, vatRate: value }))} required />
              <TextInput label="ชื่อจดทะเบียน" value={form.registeredName} onChange={(value) => setForm((current) => ({ ...current, registeredName: value }))} required />
              <TextInput label="เลขประจำตัวผู้เสียภาษี" value={form.registeredTaxId} onChange={(value) => setForm((current) => ({ ...current, registeredTaxId: value }))} required />
              <TextInput label="ตำบล/แขวง" value={form.registeredSubdistrict} onChange={(value) => setForm((current) => ({ ...current, registeredSubdistrict: value }))} required />
              <TextInput label="อำเภอ/เขต" value={form.registeredDistrict} onChange={(value) => setForm((current) => ({ ...current, registeredDistrict: value }))} required />
              <TextInput label="จังหวัด" value={form.registeredProvince} onChange={(value) => setForm((current) => ({ ...current, registeredProvince: value }))} required />
              <TextInput label="รหัสไปรษณีย์" value={form.registeredPostcode} onChange={(value) => setForm((current) => ({ ...current, registeredPostcode: value }))} required />
            </div>
          ) : null}
          <div className="grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="text-sm font-extrabold text-slate-800">บัญชีรับเงินสำหรับแอปฯ</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">ใช้แสดงให้ผู้จองโอนเงินและอัปโหลดสลิปในตะกร้า</div>
            </div>
            <TextInput label="PromptPay" value={form.paymentPromptpayId} onChange={(value) => setForm((current) => ({ ...current, paymentPromptpayId: value }))} />
            <TextInput label="ธนาคาร" value={form.paymentBankName} onChange={(value) => setForm((current) => ({ ...current, paymentBankName: value }))} />
            <TextInput label="ชื่อบัญชี" value={form.paymentBankAccountName} onChange={(value) => setForm((current) => ({ ...current, paymentBankAccountName: value }))} />
            <TextInput label="เลขบัญชี" value={form.paymentBankAccountNo} onChange={(value) => setForm((current) => ({ ...current, paymentBankAccountNo: value }))} />
            <div className="md:col-span-2">
              <FileInput label="รูปภาพ QR Code สำหรับรับชำระเงิน" onChange={setPaymentQrCodeImage} />
              {paymentQrCodeImage ? <FileSummary file={paymentQrCodeImage} /> : null}
              {data?.payment_qrcode_image_url ? (
                <div className="mt-3 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3">
                  <img src={data.payment_qrcode_image_url} alt="Payment QR Code" className="h-24 w-24 rounded-xl border border-slate-200 object-contain" />
                  <div>
                    <div className="text-sm font-extrabold text-slate-800">QR Code ปัจจุบัน</div>
                    <button type="button" onClick={() => window.open(data.payment_qrcode_image_url, '_blank', 'noopener,noreferrer')} className="mt-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">ดูรูปภาพ</button>
                  </div>
                </div>
              ) : null}
            </div>
            <label className="block md:col-span-2"><span className="mb-1.5 block text-sm font-bold text-slate-600">คำแนะนำการชำระเงิน</span><textarea value={form.paymentInstructions} onChange={(event) => setForm((current) => ({ ...current, paymentInstructions: event.target.value }))} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
          </div>
        </FormPanel>
      )}</Card>
    </>
  );
}

function AuditPage({ marketId, mode }) {
  const { user } = useAuth();
  const [range, setRange] = useState(() => currentMonthFilterDates());
  const isFinePendingReport = mode === 'fines';
  const isFinePaidReport = mode === 'paid';
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const path = marketId
    ? isFinePendingReport
      ? `/markets/${marketId}/audit-fines?startDate=${range.startDate}&endDate=${range.endDate}&paymentStatus=pending`
      : isFinePaidReport
        ? `/markets/${marketId}/audit-fines?startDate=${range.startDate}&endDate=${range.endDate}&paymentStatus=paid`
        : `/markets/${marketId}/audit-checks?startDate=${range.startDate}&endDate=${range.endDate}`
    : null;
  const { data = [], loading, reload } = useApi(path, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [keyword, setKeyword] = useState('');
  if (!marketId) return <NeedMarket />;
  const reportRows = normalizeRows(data);
  const filteredReportRows = filterRowsByKeyword(reportRows, keyword);
  const reportTitle = isFinePendingReport ? 'รายงานค่าปรับค้างจ่าย' : isFinePaidReport ? 'รายชื่อผู้จ่ายค่าปรับแบบโอน' : 'ข้อมูลการตรวจสอบตลาด';
  const exportColumns = isFinePendingReport || isFinePaidReport
    ? ['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'สถานะการตรวจสอบ', 'ค่าปรับ', 'VAT', 'จ่ายเงินเพิ่ม', 'ชื่อ Booth', 'สินค้าขาย', 'วันที่ขาย']
    : ['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'ผลตรวจ', 'ค่าปรับ', 'VAT', 'ยอดรวม', 'ชื่อ Booth', 'สินค้าขาย', 'วันที่ขาย'];
  const exportRows = filteredReportRows.map((item, index) => isFinePendingReport || isFinePaidReport
    ? [index + 1, item.booking_public_id, item.market_name || '-', item.customer_name || '-', auditResultLabel(item.result), formatMoney(Number(item.fine_amount || 0) + Number(item.accessories_fine_amount || 0) + Number(item.damage_fine_amount || 0)), formatMoney(item.vat_amount || 0), formatMoney(item.total_fine_amount), item.booth_code || item.booth_name || '-', item.product_names || '-', formatDate(item.booking_date)]
    : [index + 1, item.booking_public_id, item.market_name || '-', item.customer_name || '-', auditResultLabel(item.result), formatMoney(Number(item.fine_amount || 0) + Number(item.accessories_fine_amount || 0) + Number(item.damage_fine_amount || 0)), formatMoney(item.vat_amount || 0), formatMoney(item.total_fine_amount), item.booth_code || item.booth_name || '-', item.product_names || '-', formatDate(item.booking_date)]);

  function openPaymentModal(item) {
    setSelectedFine(item);
    setProofImage(null);
    setPaymentModalOpen(true);
  }

  async function submitFinePayment(event) {
    event.preventDefault();
    if (!selectedFine || !proofImage) return;
    const payload = new FormData();
    payload.append('finePaymentStatus', 'paid');
    payload.append('proofImage', proofImage);
    await mutate(`/markets/${marketId}/audit-checks/${selectedFine.id}/fine-payment-status`, payload, 'PATCH');
    setPaymentModalOpen(false);
    setSelectedFine(null);
    setProofImage(null);
    reload();
  }

  return (
    <>
      <PageHeader
        title={isFinePendingReport ? 'รายงานค่าปรับค้างจ่าย' : isFinePaidReport ? 'รายชื่อผู้จ่ายค่าปรับแบบโอน' : 'ตรวจสอบตลาด'}
        description={isFinePendingReport ? 'รายการค่าปรับที่ยังรอการชำระจากลูกค้า' : isFinePaidReport ? 'รายการค่าปรับที่ลูกค้าชำระแล้ว' : 'รายการตรวจสอบตลาดตามช่วงวันที่ขาย'}
        action={(
          <ReportFiltersBar>
            <div className="flex w-full flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <SearchInput value={keyword} onChange={setKeyword} placeholder="ค้นหาชื่อลูกค้า เลขที่จอง ตลาด หรือ Booth" />
              <DatePickerBare value={range.startDate} onChange={(value) => setRange((current) => ({ ...current, startDate: value }))} className="sm:w-[210px]" />
              <DatePickerBare value={range.endDate} onChange={(value) => setRange((current) => ({ ...current, endDate: value }))} className="sm:w-[210px]" />
              <ReportActionButton tone="slate" onClick={reload}>ค้นหา</ReportActionButton>
            </div>
            <ReportExportActions title={reportTitle} columns={exportColumns} rows={exportRows} disabled={!exportRows.length} />
          </ReportFiltersBar>
        )}
      />
      <Card>{loading ? <LoadingBlock /> : isFinePendingReport || isFinePaidReport ? <DataTable columns={['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'สถานะการตรวจสอบ', 'ค่าปรับ', 'VAT', 'จ่ายเงินเพิ่ม', 'ชื่อ Booth', 'สินค้าขาย', 'วันที่ขาย', 'จัดการ']} rows={filteredReportRows.map((item, index) => [index + 1, item.booking_public_id, item.market_name || '-', item.customer_name || '-', auditResultLabel(item.result), formatMoney(Number(item.fine_amount || 0) + Number(item.accessories_fine_amount || 0) + Number(item.damage_fine_amount || 0)), formatMoney(item.vat_amount || 0), formatMoney(item.total_fine_amount), item.booth_code || item.booth_name || '-', item.product_names || '-', formatDate(item.booking_date), isFinePendingReport ? <SmallButton tone="amber" onClick={() => openPaymentModal(item)} disabled={saving}>ลูกค้าจ่ายแล้ว</SmallButton> : <StatusBadge value="paid" />])} /> : <DataTable columns={['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'ผลตรวจ', 'ค่าปรับ', 'VAT', 'ยอดรวม', 'ชื่อ Booth', 'สินค้าขาย', 'วันที่ขาย']} rows={filteredReportRows.map((item, index) => [index + 1, item.booking_public_id, item.market_name || '-', item.customer_name || '-', auditResultLabel(item.result), formatMoney(Number(item.fine_amount || 0) + Number(item.accessories_fine_amount || 0) + Number(item.damage_fine_amount || 0)), formatMoney(item.vat_amount || 0), formatMoney(item.total_fine_amount), item.booth_code || item.booth_name || '-', item.product_names || '-', formatDate(item.booking_date)])} />}</Card>
      <Modal open={paymentModalOpen} title="รายละเอียด" onClose={() => setPaymentModalOpen(false)}>
        <form onSubmit={submitFinePayment} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
            <Label>ชื่อผู้จอง</Label>
            <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-sm text-slate-700">{selectedFine?.customer_name || '-'}</div>
            <Label>ยอดเงินที่จ่าย</Label>
            <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-sm text-slate-700">{selectedFine ? formatMoney(selectedFine.total_fine_amount) : '-'}</div>
            <Label>ชื่อ Booth</Label>
            <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-sm text-slate-700">{selectedFine?.booth_code || selectedFine?.booth_name || '-'}</div>
            <Label>วันที่ขาย</Label>
            <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-sm text-slate-700">{selectedFine ? formatDate(selectedFine.booking_date) : '-'}</div>
            <div className="md:col-span-2"><FileInput label="รูปหลักฐานการจ่าย" onChange={setProofImage} /></div>
            <div className="md:col-start-2"><FileSummary file={proofImage} /></div>
            <Label>ผู้ทำรายการ</Label>
            <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-sm text-slate-700">{user?.name || '-'}</div>
          </div>
          {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => setPaymentModalOpen(false)} className="h-11 rounded-xl border border-slate-300 px-8 text-sm font-bold text-slate-700">ยกเลิก</button>
            <button type="submit" disabled={saving || !proofImage} className="h-11 rounded-xl bg-cyan-600 px-8 text-sm font-bold text-white disabled:opacity-60">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function AccountingAllReportPage() {
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const marketRows = normalizeRows(markets);
  const [filters, setFilters] = useState({
    ...currentMonthFilterDates(),
    marketId: '',
    dateField: 'payment_date',
    sortBy: 'payment_date',
    keyword: '',
  });
  const queryString = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    dateField: filters.dateField,
    sortBy: filters.sortBy,
    ...(filters.marketId ? { marketId: filters.marketId } : {}),
  }).toString();
  const { data = [], loading, reload } = useApi(`/accounting/report-all?${queryString}`, { initialData: [] });
  const rows = normalizeRows(data);
  const filteredRows = filterRowsByKeyword(rows, filters.keyword);
  const columns = ['ลำดับที่', 'เลขที่ใบจอง', 'วันที่จัดงาน', 'ลูกค้า', 'วันที่ชำระเงิน', 'ค่าบริการ Booth', 'ค่าบริการอื่นๆ', 'จำนวนเงินก่อน VAT', 'ส่วนลด', 'VAT 7%', 'ภาษีหัก ณ ที่จ่าย', 'ยอดที่ต้องชำระเงิน', 'สถานะ', 'เหตุผล'];
  const exportRows = filteredRows.map((item, index) => [
    index + 1,
    item.booking_public_id || '-',
    item.booking_dates || formatDate(item.booking_date),
    item.customer_name || '-',
    item.paid_at ? formatDate(item.paid_at) : '-',
    formatMoney(item.booth_service_amount || 0),
    formatMoney(item.other_service_amount || 0),
    formatMoney(item.subtotal_amount || 0),
    formatMoney(item.discount_amount || 0),
    formatMoney(item.vat_amount || 0),
    formatMoney(item.withholding_tax_amount || 0),
    formatMoney(item.total_amount || 0),
    item.status || '-',
    item.reason || '-',
  ]);

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <PageHeader
        title="รายงานแสดงข้อมูลทั้งหมด"
        description="รายงานบัญชีรวมตามช่วงวันที่ ตลาด และเงื่อนไขการค้นหา"
        action={(
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-soft xl:min-w-[720px]">
            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex w-full flex-col gap-3 sm:flex-row xl:justify-end">
                <SearchInput value={filters.keyword} onChange={(value) => setFilter('keyword', value)} placeholder="ค้นหาลูกค้า เลขที่ใบจอง ตลาด หรือสถานะ" />
                <DatePickerBare value={filters.startDate} onChange={(value) => setFilter('startDate', value)} className="sm:w-[210px]" />
                <DatePickerBare value={filters.endDate} onChange={(value) => setFilter('endDate', value)} className="sm:w-[210px]" />
                <ReportActionButton tone="slate" onClick={reload}>ค้นหา</ReportActionButton>
              </div>
              <ReportExportActions title="รายงานแสดงข้อมูลทั้งหมด" columns={columns} rows={exportRows} disabled={!exportRows.length} />
            </div>
          </div>
        )}
      />
      <Card>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 lg:grid-cols-3">
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
          {loading ? <LoadingBlock /> : <DataTable columns={columns} rows={filteredRows.map((item, index) => [
            index + 1,
            item.booking_public_id || '-',
            item.booking_dates || formatDate(item.booking_date),
            item.customer_name || '-',
            item.paid_at ? formatDate(item.paid_at) : '-',
            formatMoney(item.booth_service_amount || 0),
            formatMoney(item.other_service_amount || 0),
            formatMoney(item.subtotal_amount || 0),
            formatMoney(item.discount_amount || 0),
            formatMoney(item.vat_amount || 0),
            formatMoney(item.withholding_tax_amount || 0),
            formatMoney(item.total_amount || 0),
            <StatusBadge value={item.status} />,
            item.reason || '-',
          ])} />}
        </div>
      </Card>
    </>
  );
}

function AccountingSalesSummaryPage() {
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const marketRows = normalizeRows(markets);
  const [filters, setFilters] = useState({
    ...currentMonthFilterDates(),
    marketId: '',
    dateField: 'payment_date',
    sortBy: 'payment_date',
    keyword: '',
  });
  const queryString = new URLSearchParams({
    paidOnly: '1',
    startDate: filters.startDate,
    endDate: filters.endDate,
    dateField: filters.dateField,
    sortBy: filters.sortBy,
    ...(filters.marketId ? { marketId: filters.marketId } : {}),
  }).toString();
  const { data = [], loading, reload } = useApi(`/accounting/report-all?${queryString}`, { initialData: [] });
  const rows = normalizeRows(data);
  const filteredRows = filterRowsByKeyword(rows, filters.keyword);
  const columns = ['#', 'เลขที่ใบจอง', 'วันที่จัดงาน', 'ลูกค้า', 'วันที่ชำระเงิน', 'ค่าบริการ Booth', 'ค่าบริการอื่นๆ', 'ค่าปรับ', 'จำนวนก่อน Vat'];
  const exportRows = filteredRows.map((item, index) => [
    index + 1,
    item.booking_public_id || '-',
    item.booking_dates || formatDate(item.booking_date),
    item.customer_name || '-',
    item.paid_at ? formatDate(item.paid_at) : '-',
    formatMoney(item.booth_service_amount || 0),
    formatMoney(item.other_service_amount || 0),
    formatMoney(item.fine_amount || 0),
    formatMoney(item.amount_before_vat || 0),
  ]);

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <PageHeader
        title="รายงานสรุปยอดขาย"
        description="สรุปยอดขายที่ชำระเงินแล้วตามช่วงวันที่และตลาด"
        action={(
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-soft xl:min-w-[720px]">
            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex w-full flex-col gap-3 sm:flex-row xl:justify-end">
                <SearchInput value={filters.keyword} onChange={(value) => setFilter('keyword', value)} placeholder="ค้นหาลูกค้า เลขที่ใบจอง หรือตลาด" />
                <DatePickerBare value={filters.startDate} onChange={(value) => setFilter('startDate', value)} className="sm:w-[210px]" />
                <DatePickerBare value={filters.endDate} onChange={(value) => setFilter('endDate', value)} className="sm:w-[210px]" />
                <ReportActionButton tone="slate" onClick={reload}>ค้นหา</ReportActionButton>
              </div>
              <ReportExportActions title="รายงานสรุปยอดขาย" columns={columns} rows={exportRows} disabled={!exportRows.length} />
            </div>
          </div>
        )}
      />
      <Card>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 lg:grid-cols-3">
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
          {loading ? <LoadingBlock /> : <DataTable columns={columns} rows={filteredRows.map((item, index) => [
            index + 1,
            item.booking_public_id || '-',
            item.booking_dates || formatDate(item.booking_date),
            item.customer_name || '-',
            item.paid_at ? formatDate(item.paid_at) : '-',
            formatMoney(item.booth_service_amount || 0),
            formatMoney(item.other_service_amount || 0),
            formatMoney(item.fine_amount || 0),
            formatMoney(item.amount_before_vat || 0),
          ])} />}
        </div>
      </Card>
    </>
  );
}

function AccountingStandardReportPage({ reportType }) {
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const marketRows = normalizeRows(markets);
  const [filters, setFilters] = useState({
    ...currentMonthFilterDates(),
    marketId: '',
    documentType: 'all',
    documentStatus: 'all',
    keyword: '',
  });
  const reportMap = {
    documents: {
      title: 'ทะเบียนเอกสารบัญชี',
      description: 'ตรวจสอบใบเสร็จ ใบกำกับภาษี ใบลดหนี้ และสถานะเอกสาร',
      path: '/accounting/documents',
      columns: ['เลขเอกสาร', 'ประเภท', 'สถานะ', 'วันที่ออก', 'เลขที่ใบจอง', 'เลขชำระเงิน', 'ลูกค้า', 'ก่อน VAT', 'ส่วนลด', 'VAT', 'ยอดรวม', 'เอกสารอ้างอิง', 'ผู้ทำรายการ', 'เหตุผล'],
      row: (item) => [item.document_no || '-', accountingDocumentLabel(item.document_type), item.document_status || '-', formatDate(item.issue_date), item.booking_public_id || '-', item.payment_public_id || '-', item.customer_name || '-', formatMoney(item.subtotal_amount || 0), formatMoney(item.discount_amount || 0), formatMoney(item.vat_amount || 0), formatMoney(item.total_amount || 0), item.source_document_no || '-', item.issued_by_name || '-', item.cancel_reason || '-'],
    },
    'tax-sales': {
      title: 'รายงานภาษีขาย',
      description: 'อ้างอิงจากใบกำกับภาษีและใบลดหนี้ที่ออกจริง',
      path: '/accounting/tax-sales',
      columns: ['วันที่', 'เลขที่เอกสาร', 'ประเภท', 'สถานะ', 'เลขที่ใบจอง', 'ลูกค้า', 'มูลค่าก่อน VAT', 'VAT', 'ยอดรวม', 'เอกสารอ้างอิง'],
      row: (item) => [formatDate(item.issue_date), item.document_no || '-', accountingDocumentLabel(item.document_type), item.document_status || '-', item.booking_public_id || '-', item.customer_name || '-', formatMoney(item.taxable_amount || 0), formatMoney(item.vat_report_amount || 0), formatMoney(item.total_report_amount || 0), item.source_document_no || '-'],
    },
    receivables: {
      title: 'ลูกหนี้ค้างชำระ',
      description: 'รวมค่าจองและค่าปรับที่ยังค้างชำระ พร้อมช่วงอายุหนี้',
      path: '/accounting/receivables-aging',
      columns: ['ประเภท', 'เลขที่อ้างอิง', 'ตลาด', 'ลูกค้า', 'วันที่ขาย', 'วันครบกำหนด', 'อายุหนี้', 'ช่วงอายุหนี้', 'สถานะ', 'ยอดค้างชำระ'],
      row: (item) => [receivableTypeLabel(item.receivable_type), item.source_public_id || '-', item.market_name || '-', item.customer_name || '-', item.booking_dates || '-', formatDate(item.due_date), `${Math.max(Number(item.aging_days || 0), 0)} วัน`, item.aging_bucket || '-', item.status || '-', formatMoney(item.outstanding_amount || 0)],
    },
    reconciliation: {
      title: 'กระทบยอดชำระเงิน',
      description: 'ตรวจสอบยอด payment เทียบ booking, callback และเอกสารบัญชี',
      path: '/accounting/reconciliation',
      columns: ['เลขชำระเงิน', 'ประเภทการชำระเงิน', 'Reference', 'เลขที่ใบจอง', 'ตลาด', 'สถานะชำระเงิน', 'สถานะจอง', 'ยอดชำระ', 'ยอดอ้างอิง', 'Callback', 'เอกสาร', 'ผลกระทบยอด', 'วันที่ทำรายการ'],
      row: (item) => [item.payment_public_id || '-', paymentTypeLabel(item.payment_kind), item.provider_reference || '-', item.booking_public_id || '-', item.market_name || '-', item.payment_status || '-', item.booking_status || '-', formatMoney(item.payment_amount || 0), formatMoney(item.booking_amount || 0), Number(item.callback_count || 0), item.document_no || '-', reconciliationLabel(item.reconciliation_status), formatDate(item.paid_at || item.created_at)],
    },
    refunds: {
      title: 'คืนเงิน/ใบลดหนี้',
      description: 'รายการใบลดหนี้และรายการชำระเงินที่ถูกคืนหรือยกเลิก',
      path: '/accounting/refunds',
      columns: ['วันที่', 'ประเภท', 'เลขที่เอกสาร', 'สถานะ', 'เลขที่ใบจอง', 'เลขชำระเงิน', 'ลูกค้า', 'ยอดเงิน', 'เอกสารอ้างอิง', 'ผู้ทำรายการ', 'เหตุผล'],
      row: (item) => [formatDate(item.issue_date), item.refund_type === 'credit_note' ? 'ใบลดหนี้' : 'คืน/ยกเลิกชำระเงิน', item.document_no || '-', item.document_status || '-', item.booking_public_id || '-', item.payment_public_id || '-', item.customer_name || '-', formatMoney(item.total_amount || 0), item.source_document_no || '-', item.issued_by_name || '-', item.reason || '-'],
    },
  };
  const config = reportMap[reportType] || reportMap.documents;
  const params = new URLSearchParams();
  if (reportType === 'receivables') {
    params.set('asOfDate', filters.asOfDate);
    if (filters.marketId) params.set('marketId', filters.marketId);
  } else {
    params.set('startDate', filters.startDate);
    params.set('endDate', filters.endDate);
    if (reportType === 'documents') {
      params.set('documentType', filters.documentType);
      params.set('documentStatus', filters.documentStatus);
      if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
    }
    if (reportType === 'reconciliation' && filters.marketId) params.set('marketId', filters.marketId);
  }
  const { data = [], loading, reload } = useApi(`${config.path}?${params.toString()}`, { initialData: [] });
  const rows = normalizeRows(data);
  const filteredRows = filterRowsByKeyword(rows, filters.keyword);
  const exportRows = filteredRows.map(config.row);

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        action={(
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-soft xl:min-w-[780px]">
            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                <SearchInput value={filters.keyword} onChange={(value) => setFilter('keyword', value)} placeholder="ค้นหาเลขเอกสาร ลูกค้า ใบจอง หรือตลาด" />
                {reportType === 'receivables' ? (
                  <DatePickerBare value={filters.asOfDate} onChange={(value) => setFilter('asOfDate', value)} className="sm:w-[210px]" />
                ) : (
                  <>
                    <DatePickerBare value={filters.startDate} onChange={(value) => setFilter('startDate', value)} className="sm:w-[210px]" />
                    <DatePickerBare value={filters.endDate} onChange={(value) => setFilter('endDate', value)} className="sm:w-[210px]" />
                  </>
                )}
                <ReportActionButton tone="slate" onClick={reload}>ค้นหา</ReportActionButton>
              </div>
              <ReportExportActions title={config.title} columns={config.columns} rows={exportRows} disabled={!exportRows.length} />
            </div>
          </div>
        )}
      />
      <Card>
        <div className="space-y-6">
          {reportType === 'documents' ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <select value={filters.documentType} onChange={(event) => setFilter('documentType', event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
                  <option value="all">ทุกประเภทเอกสาร</option>
                  <option value="receipt">ใบเสร็จรับเงิน</option>
                  <option value="tax_invoice">ใบกำกับภาษี / ใบเสร็จรับเงิน</option>
                  <option value="credit_note">ใบลดหนี้</option>
                </select>
                <select value={filters.documentStatus} onChange={(event) => setFilter('documentStatus', event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
                  <option value="all">ทุกสถานะ</option>
                  <option value="issued">ออกเอกสารแล้ว</option>
                  <option value="cancelled">ยกเลิก</option>
                  <option value="void">ไม่ใช้เอกสาร</option>
                </select>
              </div>
            </div>
          ) : null}
          {['receivables', 'reconciliation'].includes(reportType) ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <select value={filters.marketId} onChange={(event) => setFilter('marketId', event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 lg:max-w-sm">
                <option value="">ทุกตลาด</option>
                {marketRows.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
              </select>
            </div>
          ) : null}
          {loading ? <LoadingBlock /> : <DataTable columns={config.columns} rows={exportRows} />}
        </div>
      </Card>
    </>
  );
}

function AccountingPage({ paidOnly = false }) {
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const marketRows = normalizeRows(markets);
  const [filters, setFilters] = useState({
    ...currentMonthFilterDates(),
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
  }).toString();
  const { data = [], loading, reload } = useApi(`/accounting/payments?${queryString}`, { initialData: [] });
  const { mutate: mutateDocument, loading: issuingDocument } = useMutation();
  const rows = normalizeRows(data);
  const filteredRows = filterRowsByKeyword(rows, filters.keyword);
  const exportColumns = paidOnly
    ? ['เลขชำระเงิน', 'ประเภทการชำระเงิน', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน']
    : ['เลขชำระเงิน', 'ประเภทการชำระเงิน', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'สถานะ', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน'];
  const exportRows = filteredRows.map((payment) => {
    const baseRow = [payment.public_id, paymentTypeLabel(payment.payment_kind), payment.booking_public_id || '-', payment.market_name || '-', formatBookingDateSummary(payment.booking_dates), payment.booths || '-', payment.customer_name || '-'];
    const amountRow = [formatMoney(payment.subtotal_amount || 0), formatMoney(payment.discount_amount || 0), formatMoney(payment.vat_amount || 0), formatMoney(payment.amount), formatDate(payment.paid_at || payment.created_at)];
    return paidOnly ? [...baseRow, ...amountRow] : [...baseRow, payment.status || '-', ...amountRow];
  });

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function issueAndPrintPaymentDocument(payment) {
    const payload = await mutateDocument(`/accounting/payments/${payment.id}/document`, {}, 'POST');
    openPaymentDocumentWindow(payload);
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
      <Card>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 lg:grid-cols-3">
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
          {loading ? <LoadingBlock /> : <DataTable columns={paidOnly ? ['เลขชำระเงิน', 'ประเภทการชำระเงิน', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน', 'จัดการ'] : ['เลขชำระเงิน', 'ประเภทการชำระเงิน', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'สถานะ', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน', 'จัดการ']} rows={filteredRows.map((payment) => {
            const baseRow = [
              payment.public_id,
              paymentTypeLabel(payment.payment_kind),
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

function AdminsPage({ marketId }) {
  const { data: admins = [], loading: adminsLoading, reload: reloadAdmins } = useApi('/admins', { initialData: [] });
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const { mutate, loading, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const marketRows = normalizeRows(markets);
  const adminRows = normalizeRows(admins).sort((left, right) => Number(left.id) - Number(right.id));
  const [form, setForm] = useState({ username: '', password: '', role: 'admin', name: '', email: '', phone: '', marketId: String(marketId || ''), status: 'active' });
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  function resetForm() {
    setForm({ username: '', password: '', role: 'admin', name: '', email: '', phone: '', marketId: String(marketId || ''), status: 'active' });
    setFormError('');
    setEditingAdmin(null);
  }

  async function submit(event) {
    event.preventDefault();
    const validationError = validateAdminForm(form, { requireUsername: !editingAdmin, requirePassword: !editingAdmin });
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const marketIds = form.role === 'accounting' || form.role === 'supervisor' ? [] : [Number(form.marketId || marketRows[0]?.id)].filter(Boolean);
    if (editingAdmin) {
      const payload = { role: form.role, name: form.name, email: form.email, phone: form.phone, marketIds, status: form.status };
      if (form.password) payload.password = form.password;
      await mutate(`/admins/${editingAdmin.id}`, payload, 'PATCH');
      setMessage('แก้ไขผู้ดูแลระบบสำเร็จ');
      setEditModalOpen(false);
    } else {
      await mutate('/admins', { ...form, marketIds });
      setMessage('สร้างผู้ดูแลระบบสำเร็จ');
      setModalOpen(false);
    }
    resetForm();
    reloadAdmins();
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingAdmin(item);
    setForm({
      username: '',
      password: '',
      role: item.role || 'admin',
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      marketId: String(item.assigned_market_ids?.[0] || marketId || marketRows[0]?.id || ''),
      status: item.status || 'active',
    });
    setFormError('');
    setEditModalOpen(true);
  }

  async function updateStatus(item, status) {
    await mutate(`/admins/${item.id}`, {
      role: item.role,
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      marketIds: item.role === 'accounting' || item.role === 'supervisor' ? [] : item.assigned_market_ids || [],
      status,
    }, 'PATCH');
    reloadAdmins();
  }

  return (
    <>
      <PageHeader title="ผู้ดูแลระบบ" description="สร้างบัญชีผู้ดูแลและกำหนดสิทธิ์ตลาด" action={<button onClick={openCreateModal} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มผู้ดูแล</button>} />
      <div className="grid gap-6">
        <Modal open={modalOpen} title="เพิ่มผู้ดูแล" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={loading} error={formError || error}>
          {message ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          <TextInput label="Username" value={form.username} onChange={(value) => setForm((current) => ({ ...current, username: value }))} required />
          <TextInput label="Password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} type="password" required />
          <PasswordPolicyHint />
          <SelectInput label="Role" value={form.role} onChange={(value) => setForm((current) => ({ ...current, role: value }))} options={[['admin', 'admin'], ['supervisor', 'supervisor'], ['accounting', 'accounting'], ['audit', 'audit']]} />
          <TextInput label="ชื่อ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <TextInput label="Phone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          {['admin', 'audit'].includes(form.role) ? (
            <SelectInput label="ตลาดที่รับผิดชอบ" value={form.marketId || marketRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, marketId: value }))} options={marketRows.map((item) => [String(item.id), item.name])} />
          ) : null}
        </FormPanel>
        </Modal>
        <Modal open={editModalOpen} title="แก้ไขผู้ดูแล" onClose={() => setEditModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={loading} error={formError || error}>
          <TextInput label="Password ใหม่" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} type="password" />
          <PasswordPolicyHint />
          <SelectInput label="Role" value={form.role} onChange={(value) => setForm((current) => ({ ...current, role: value }))} options={[['admin', 'admin'], ['supervisor', 'supervisor'], ['accounting', 'accounting'], ['audit', 'audit']]} />
          <TextInput label="ชื่อ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <TextInput label="Phone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'active'], ['inactive', 'inactive']]} />
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
        <Card>
          <SectionTitle title="รายการผู้ดูแลระบบ" description="ข้อมูลบัญชีผู้ดูแลทั้งหมดภายในองค์กร" icon={Users} />
          {adminsLoading ? <LoadingBlock /> : (
            <DataTable
              columns={['ID', 'ชื่อ', 'Role', 'Email', 'Phone', 'สถานะ', 'จัดการ']}
              rows={adminRows.map((item) => [
                item.id,
                item.name || '-',
                item.role,
                item.email || '-',
                item.phone || '-',
                <StatusBadge value={item.status} />,
                <div className="flex flex-wrap gap-2">
                  <SmallButton tone="amber" onClick={() => openEditModal(item)}>แก้ไข</SmallButton>
                  {item.status === 'active'
                    ? <SmallButton tone="red" onClick={() => updateStatus(item, 'inactive')}>ปิดใช้งาน</SmallButton>
                    : <SmallButton tone="cyan" onClick={() => updateStatus(item, 'active')}>เปิดใช้งาน</SmallButton>}
                </div>,
              ])}
            />
          )}
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

function PaymentList({ rows }) {
  if (!rows?.length) return <EmptyState />;
  return (
    <div className="space-y-3">
      {rows.slice(0, 8).map((payment) => (
        <div key={payment.id || payment.public_id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
          <div>
            <p className="font-bold text-slate-950">{payment.public_id}</p>
            <p className="text-sm text-slate-500">{paymentTypeLabel(payment.payment_kind)} · {payment.booking_dates || '-'} · {payment.booths || '-'}</p>
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


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
    </Routes>
  );
}
