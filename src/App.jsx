import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  Bold,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
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
  Megaphone,
  Menu,
  Package,
  Percent,
  Plus,
  Printer,
  Redo2,
  Search,
  Settings,
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
import { API_BASE_URL, request } from './api/client.js';
import { useApi, useMutation } from './hooks/useApi.js';
import { useAuth } from './state/auth.jsx';

const menu = [
  { path: '/', label: 'ภาพรวม', icon: LayoutDashboard, menuKey: 'dashboard', roles: ['supervisor', 'admin', 'accounting'] },
  {
    label: 'จัดการตลาด',
    icon: Store,
    menuKey: 'markets',
    children: [
      { path: '/markets', label: 'รายชื่อตลาด' },
      { path: '/market-info', label: 'ข้อมูลทั่วไป' },
      { path: '/booth-types', label: 'แผนผังบูธ' },
      { path: '/booths', label: 'จัดการบูธ' },
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
    ],
  },
  {
    label: 'ตรวจสอบตลาด',
    icon: ClipboardCheck,
    menuKey: 'market_audit',
    children: [
      { path: '/audit', label: 'ข้อมูลการตรวจสอบ' },
      { path: '/audit-fines', label: 'รายงานค่าปรับค้างจ่าย' },
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
      { path: '/accounting-payments', label: 'รายงานการชำระเงิน' },
      { path: '/accounting-summary', label: 'รายงานสรุปยอดขาย' },
      { path: '/accounting-documents', label: 'ทะเบียนเอกสารบัญชี' },
      { path: '/accounting-tax-sales', label: 'รายงานภาษีขาย' },
      { path: '/accounting-receivables', label: 'ลูกหนี้ค้างชำระ' },
      { path: '/accounting-reconciliation', label: 'กระทบยอดชำระเงิน' },
      { path: '/accounting-refunds', label: 'คืนเงิน/ใบลดหนี้' },
      { path: '/accounting-product-types', label: 'รายงานประเภทสินค้าที่ขาย' },
    ],
  },
  { path: '/organization-settings', label: 'ตั้งค่าองค์กร', icon: Settings, menuKey: 'organization_settings', roles: ['supervisor'] },
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

const SubscriptionContext = createContext({
  subscription: null,
  featureKey: 'dashboard',
  actionBlocked: false,
  blockedMessage: '',
});

const subscriptionFeatureByPath = [
  [/^\/organization-settings/, 'organization_settings'],
  [/^\/admins/, 'admin_management'],
  [/^\/pdpa/, 'pdpa_management'],
  [/^\/announcements/, 'announcements'],
  [/^\/tenant/, 'tenant_management'],
  [/^\/market-info|^\/markets|^\/holidays|^\/holiday-calendar|^\/market-images|^\/accessories/, 'market_management'],
  [/^\/booth-types|^\/booths/, 'booth_management'],
  [/^\/product-categories|^\/product-groups|^\/products/, 'product_management'],
  [/^\/coupons|^\/coupon-assignments/, 'coupon_management'],
  [/^\/bookings|^\/booking-edit|^\/booking-edits/, 'booking_management'],
  [/^\/reports|^\/report-/, 'reports'],
  [/^\/audit/, 'market_audit'],
  [/^\/accounting/, 'accounting'],
];

function resolveSubscriptionFeature(pathname = '/') {
  return subscriptionFeatureByPath.find(([pattern]) => pattern.test(pathname))?.[1] || 'dashboard';
}

function buildSubscriptionGate(subscription, featureKey) {
  if (!subscription) {
    return {
      actionBlocked: false,
      blockedMessage: '',
    };
  }
  if (!subscription.writeAllowed) {
    return {
      actionBlocked: true,
      blockedMessage: 'แพ็คเกจหมดอายุหรือยังไม่พร้อมใช้งาน ระบบเปิดให้ดูข้อมูลได้เท่านั้น',
    };
  }
  if (subscription.fullFunction || subscription.plan?.isFullFunction) {
    return {
      actionBlocked: false,
      blockedMessage: '',
    };
  }
  const entitlement = subscription.entitlements?.[featureKey];
  if (!entitlement || entitlement.enabled === false) {
    return {
      actionBlocked: true,
      blockedMessage: 'แพ็คเกจปัจจุบันไม่รองรับฟังก์ชั่นนี้',
    };
  }
  return {
    actionBlocked: false,
    blockedMessage: '',
  };
}

function useSubscription() {
  return useContext(SubscriptionContext);
}

function formatMoney(value) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' }).format(new Date(value));
}

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

function normalizeRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function reportFileName(title, extension) {
  const date = new Date().toISOString().slice(0, 10);
  const safeTitle = String(title || 'report').replace(/[^\w\u0E00-\u0E7F-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'report';
  return `${safeTitle}-${date}.${extension}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    expired: 'bg-slate-100 text-slate-600 ring-slate-200',
    inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return <span className={classNames('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', styles[status] || styles.active)}>{value || '-'}</span>;
}

function boothAvailabilityLabel(status) {
  const labels = {
    available: 'ว่าง',
    selected: 'กำลังเลือก',
    processing: 'กำลังดำเนินการ',
    booked: 'ถูกจองแล้ว',
  };
  return labels[status] || status || '-';
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
  const [form, setForm] = useState({ username: '', password: '' });
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
    return menu.filter((item) => allowed.has(item.menuKey) || item.roles?.includes(user?.role));
  }, [user]);

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
            <Routes>
              <Route path="/" element={<Dashboard marketId={currentMarketId} markets={marketRows} />} />
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
            </Routes>
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
          <div>
            <div className="text-xl font-extrabold">Jonglock</div>
            <div className="text-xs text-slate-400">Management Console</div>
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

function Topbar({ user, markets, currentMarketId, marketsLoading, showMarketSelector, subscription, subscriptionLoading, onSelectMarket, onOpenSidebar, onLogout }) {
  const endAt = subscription?.effectiveEndAt ? formatDate(subscription.effectiveEndAt) : '-';
  const statusText = subscriptionLoading
    ? 'กำลังโหลดแพ็คเกจ'
    : subscription?.plan?.name
      ? `${subscription.plan.name} · ${subscription.accessStatus === 'expired' ? 'หมดอายุ' : `ใช้ได้ถึง ${endAt}`}`
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
        <button data-subscription-ignore="true" onClick={onLogout} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800">
          <LogOut size={16} />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
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
    cyan: 'bg-cyan-600 text-white',
    red: 'bg-red-600 text-white',
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

function MarketsPage({ markets, reloadMarkets }) {
  const { token } = useAuth();
  const { mutate, loading, error } = useMutation();
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '', openDate: '', closeDate: '' });
  const [mainImageFile, setMainImageFile] = useState(null);
  const rows = markets.filter((market) => `${market.code} ${market.name}`.toLowerCase().includes(keyword.toLowerCase()));

  async function openCreateModal() {
    setMainImageFile(null);
    setForm({ code: '', name: '', description: '', openDate: '', closeDate: '' });
    setModalOpen(true);
    try {
      const payload = await request('/markets/next-code', { token });
      setForm((current) => ({ ...current, code: payload.data?.code || '' }));
    } catch {}
  }

  async function submit(event) {
    event.preventDefault();
    if (isNews && !form.marketId) {
      window.alert('กรุณาเลือกตลาดสำหรับข่าวสาร');
      return;
    }
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
        action={<button onClick={openCreateModal} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มตลาด</button>}
      />
      <div className="grid gap-6">
        <Card>
          <Toolbar keyword={keyword} onKeyword={setKeyword} />
          <DataTable
            columns={['ลำดับ', 'รหัสตลาด', 'ชื่อตลาด', 'วันเปิด', 'วันปิด', 'สถานะ']}
            rows={rows.map((market, index) => [
              index + 1,
              market.code || '-',
              market.name,
              formatDate(market.open_date),
              formatDate(market.close_date),
              <StatusBadge value={market.status || 'active'} />,
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
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start"><Label>เงื่อนไขข้อตกลง</Label><RichTextEditor value={form.terms} onChange={(value) => setForm((current) => ({ ...current, terms: value }))} /></div>
        </FormPanel>
      </Card>
    </>
  );
}

function BoothTypesPage({ marketId }) {
  const { data = [], loading, error, reload } = useApi(marketId ? `/markets/${marketId}/booth-types` : null, { initialData: [] });
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [editingBoothType, setEditingBoothType] = useState(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'active' });
  const [editForm, setEditForm] = useState({ name: '', startDate: '', endDate: '', status: 'active' });
  const [copyForm, setCopyForm] = useState({ sourceBoothTypeId: '', name: '', startDate: '', endDate: '', status: 'active' });
  const [planImageFile, setPlanImageFile] = useState(null);
  const [editPlanImageFile, setEditPlanImageFile] = useState(null);
  const [copyPlanImageFile, setCopyPlanImageFile] = useState(null);
  const rows = normalizeRows(data);

  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('startDate', form.startDate);
    payload.append('endDate', form.endDate);
    payload.append('status', form.status);
    if (planImageFile) payload.append('planImage', planImageFile);
    await mutate(`/markets/${marketId}/booth-types`, payload);
    setForm({ name: '', startDate: '', endDate: '', status: 'active' });
    setPlanImageFile(null);
    setModalOpen(false);
    reload();
  }

  function openEditModal(item) {
    setEditingBoothType(item);
    setEditForm({
      name: item.name || item.title || '',
      startDate: item.start_date ? String(item.start_date).slice(0, 10) : '',
      endDate: item.end_date ? String(item.end_date).slice(0, 10) : '',
      status: item.status || 'active',
    });
    setEditPlanImageFile(null);
    setEditModalOpen(true);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingBoothType) return;
    const payload = new FormData();
    payload.append('name', editForm.name);
    payload.append('startDate', editForm.startDate);
    payload.append('endDate', editForm.endDate);
    payload.append('status', editForm.status);
    if (editPlanImageFile) payload.append('planImage', editPlanImageFile);
    await mutate(`/markets/${marketId}/booth-types/${editingBoothType.id}`, payload, 'PATCH');
    setEditModalOpen(false);
    setEditingBoothType(null);
    setEditPlanImageFile(null);
    reload();
  }

  function openCopyModal() {
    const source = rows[0];
    setCopyForm({
      sourceBoothTypeId: source?.id ? String(source.id) : '',
      name: '',
      startDate: source?.start_date ? String(source.start_date).slice(0, 10) : '',
      endDate: source?.end_date ? String(source.end_date).slice(0, 10) : '',
      status: 'active',
    });
    setCopyPlanImageFile(null);
    setCopyModalOpen(true);
  }

  async function submitCopy(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append('sourceBoothTypeId', copyForm.sourceBoothTypeId);
    payload.append('name', copyForm.name);
    payload.append('startDate', copyForm.startDate);
    payload.append('endDate', copyForm.endDate);
    payload.append('status', copyForm.status);
    if (copyPlanImageFile) payload.append('planImage', copyPlanImageFile);
    await mutate(`/markets/${marketId}/booth-types/copy`, payload);
    setCopyModalOpen(false);
    setCopyPlanImageFile(null);
    reload();
  }

  return (
    <>
      <PageHeader title="แผนผังบูธ" description="จัดการรูปแบบแผนผังบูธและช่วงวันที่เปิดใช้งาน" action={<div className="flex gap-2"><OutlineButton onClick={openCopyModal}>Copy Booth</OutlineButton><button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มแผนผังบูธ</button></div>} />
      <div className="grid gap-6">
        <Card>
          <ErrorNotice error={error} hint="ถ้ายังไม่มี endpoint นี้ ให้เพิ่ม backend endpoint /markets/:marketId/booth-types" />
          {loading ? <LoadingBlock /> : (
            <DataTable
              columns={['ลำดับ', 'ผังภาพรวม', 'ชื่อแบบ', 'เริ่มต้น', 'สิ้นสุด', 'สถานะ', 'จัดการ']}
              rows={rows.map((item, index) => [
                index + 1,
                item.plan_image_url ? <img src={item.plan_image_url} className="h-16 w-24 rounded-xl object-cover" /> : <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-400">ไม่มีผัง</div>,
                item.name || item.title,
                formatDate(item.start_date),
                formatDate(item.end_date),
                <StatusBadge value={item.status || 'active'} />,
                <div className="flex gap-2"><SmallButton tone="amber" onClick={() => openEditModal(item)}>แก้ไขข้อมูล</SmallButton></div>,
              ])}
            />
          )}
        </Card>
        <Modal open={modalOpen} title="เพิ่มแผนผังบูธ" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={saveError}>
          <TextInput label="ชื่อแผนผังบูธ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <FileInput label="แผนผังภาพรวมของตลาด" onChange={setPlanImageFile} />
          {planImageFile ? <FileSummary file={planImageFile} /> : null}
          <DatePicker label="วันที่เริ่มต้น" value={form.startDate} onChange={(value) => setForm((current) => ({ ...current, startDate: value }))} />
          <DatePicker label="วันที่สิ้นสุด" value={form.endDate} onChange={(value) => setForm((current) => ({ ...current, endDate: value }))} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ระงับการใช้']]} />
        </FormPanel>
        </Modal>
        <Modal open={editModalOpen} title="แก้ไขแผนผังบูธ" onClose={() => setEditModalOpen(false)}>
        <FormPanel onSubmit={submitEdit} loading={saving} error={saveError}>
          <TextInput label="ชื่อแผนผังบูธ" value={editForm.name} onChange={(value) => setEditForm((current) => ({ ...current, name: value }))} required />
          {editingBoothType?.plan_image_url ? <img src={editingBoothType.plan_image_url} className="h-48 w-full rounded-2xl object-cover" /> : null}
          <FileInput label="แผนผังภาพรวมของตลาด" onChange={setEditPlanImageFile} />
          {editPlanImageFile ? <FileSummary file={editPlanImageFile} /> : null}
          <DatePicker label="วันที่เริ่มต้น" value={editForm.startDate} onChange={(value) => setEditForm((current) => ({ ...current, startDate: value }))} />
          <DatePicker label="วันที่สิ้นสุด" value={editForm.endDate} onChange={(value) => setEditForm((current) => ({ ...current, endDate: value }))} />
          <SelectInput label="สถานะ" value={editForm.status} onChange={(value) => setEditForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ระงับการใช้']]} />
        </FormPanel>
        </Modal>
        <Modal open={copyModalOpen} title="Copy Booth" onClose={() => setCopyModalOpen(false)}>
        <FormPanel onSubmit={submitCopy} loading={saving} error={saveError}>
          <SelectInput label="แผนผังบูธต้นแบบ" value={copyForm.sourceBoothTypeId} onChange={(value) => setCopyForm((current) => ({ ...current, sourceBoothTypeId: value }))} options={rows.map((item) => [String(item.id), item.name || item.title])} />
          <TextInput label="ชื่อแผนผังบูธใหม่" value={copyForm.name} onChange={(value) => setCopyForm((current) => ({ ...current, name: value }))} required />
          <FileInput label="รูปภาพแผนผัง" onChange={setCopyPlanImageFile} />
          {copyPlanImageFile ? <FileSummary file={copyPlanImageFile} /> : null}
          <DatePicker label="วันที่เริ่มต้น" value={copyForm.startDate} onChange={(value) => setCopyForm((current) => ({ ...current, startDate: value }))} required />
          <DatePicker label="วันที่สิ้นสุด" value={copyForm.endDate} onChange={(value) => setCopyForm((current) => ({ ...current, endDate: value }))} required />
          <SelectInput label="สถานะการเปิดใช้งาน" value={copyForm.status} onChange={(value) => setCopyForm((current) => ({ ...current, status: value }))} options={[['active', 'เปิดใช้งาน'], ['inactive', 'ปิดใช้งาน']]} />
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

function BoothsPage({ marketId }) {
  const { token } = useAuth();
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', floorPlanId: '', categoryId: '', code: '', name: '', price: '500', sortOrder: '0', status: 'active' });

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

  async function openCreateModal() {
    setForm({
      floorPlanId: selectedType || '',
      categoryId: String(categoryRows[0]?.id || ''),
      code: '',
      name: '',
      price: '500',
      sortOrder: '0',
      status: 'active',
    });
    setModalOpen(true);
    try {
      const payload = await request(`/markets/${marketId}/booths/next-code`, { token });
      setForm((current) => ({ ...current, code: payload.data?.code || '' }));
    } catch {}
  }

  function openEditModal(booth) {
    setEditForm({
      id: booth.id,
      floorPlanId: String(booth.floor_plan_id || booth.floorPlanId || ''),
      categoryId: String(booth.category_id || booth.categoryId || ''),
      code: booth.code || '',
      name: booth.name || '',
      price: String(booth.price ?? '0'),
      sortOrder: String(booth.sort_order ?? booth.sortOrder ?? '0'),
      status: booth.status || 'active',
    });
    setEditModalOpen(true);
  }

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

  async function submitEdit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/booths/${editForm.id}`, {
      floorPlanId: Number(editForm.floorPlanId || typeRows[0]?.id) || null,
      categoryId: Number(editForm.categoryId || categoryRows[0]?.id) || null,
      code: editForm.code,
      name: editForm.name,
      price: Number(editForm.price),
      sortOrder: Number(editForm.sortOrder),
      status: editForm.status,
    }, 'PATCH');
    setEditModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader title="จัดการบูธ" description="เลือกแผนผังบูธก่อน แล้วกรองตามประเภทสินค้าที่ผูกกับบูธ" action={<button onClick={openCreateModal} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มบูธ</button>} />
      <Card>
        <ErrorNotice error={error} hint="ตรวจสอบ endpoint /markets/:marketId/booths และความสัมพันธ์ booths.category_id -> product_categories.id" />
        <div className="mb-8 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-cyan-600">
            <option value="">กรุณาเลือกแผนผังบูธ</option>
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
          <EmptyState title="ยังไม่ได้เลือกแผนผังบูธ" description="เลือกแผนผังบูธจากรายการด้านซ้ายก่อน เพื่อแสดงผังและรายการบูธ" />
        ) : loading ? <LoadingBlock /> : filteredRows.length ? (
          <div className="flex flex-wrap gap-5">
            {filteredRows.map((booth) => (
              <BoothBox
                key={booth.id || booth.code || booth.name}
                danger={booth.status !== 'active'}
                label={booth.code || booth.name || booth.id}
                subLabel={booth.category_name || 'ยังไม่ระบุ'}
                onClick={() => openEditModal(booth)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="ไม่พบบูธตามเงื่อนไข" description="แผนผังบูธนี้ยังไม่มีบูธ หรือไม่มีบูธในประเภทที่เลือก" />
        )}
      </Card>
      <Modal open={modalOpen} title="เพิ่มบูธ" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={saveError}>
          <SelectInput label="แผนผังบูธ" value={form.floorPlanId || selectedType || typeRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, floorPlanId: value }))} options={typeRows.map((item) => [String(item.id), item.name])} />
          <SelectInput label="ประเภทสินค้า" value={form.categoryId || categoryRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, categoryId: value }))} options={categoryRows.map((item) => [String(item.id), item.name])} />
          <TextInput label="รหัสบูธ" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} required />
          <TextInput label="ชื่อบูธ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="ราคา" type="number" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} />
          <TextInput label="ลำดับ" type="number" value={form.sortOrder} onChange={(value) => setForm((current) => ({ ...current, sortOrder: value }))} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ปิดการใช้งาน'], ['maintenance', 'ซ่อมบำรุง']]} />
        </FormPanel>
      </Modal>
      <Modal open={editModalOpen} title="แก้ไขบูธ" onClose={() => setEditModalOpen(false)}>
        <FormPanel onSubmit={submitEdit} loading={saving} error={saveError}>
          <SelectInput label="แผนผังบูธ" value={editForm.floorPlanId || ''} onChange={(value) => setEditForm((current) => ({ ...current, floorPlanId: value }))} options={typeRows.map((item) => [String(item.id), item.name])} />
          <SelectInput label="ประเภทสินค้า" value={editForm.categoryId || ''} onChange={(value) => setEditForm((current) => ({ ...current, categoryId: value }))} options={categoryRows.map((item) => [String(item.id), item.name])} />
          <TextInput label="รหัสบูธ" value={editForm.code} onChange={(value) => setEditForm((current) => ({ ...current, code: value }))} required />
          <TextInput label="ชื่อบูธ" value={editForm.name} onChange={(value) => setEditForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="ราคา" type="number" value={editForm.price} onChange={(value) => setEditForm((current) => ({ ...current, price: value }))} />
          <TextInput label="ลำดับ" type="number" value={editForm.sortOrder} onChange={(value) => setEditForm((current) => ({ ...current, sortOrder: value }))} />
          <SelectInput label="สถานะ" value={editForm.status} onChange={(value) => setEditForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ปิดการใช้งาน'], ['maintenance', 'ซ่อมบำรุง']]} />
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

function BoothBox({ label, subLabel, danger = false, tone = '', onClick, disabled = false }) {
  const tones = {
    available: 'border-emerald-300 bg-emerald-600 hover:bg-emerald-700',
    selected: 'border-amber-300 bg-amber-500 hover:bg-amber-600',
    processing: 'border-amber-300 bg-amber-500',
    booked: 'border-red-300 bg-red-500',
    danger: 'border-red-300 bg-red-500',
    default: 'border-cyan-200 bg-cyan-600 hover:bg-cyan-700',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={classNames(
        'flex min-h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed px-2 text-center text-sm font-bold text-white shadow-sm transition',
        tones[tone] || (danger ? tones.danger : tones.default),
        onClick && !disabled ? 'hover:-translate-y-0.5' : 'cursor-default',
        disabled ? 'opacity-90' : '',
      )}
    >
      <span>{label}</span>
      <span className="mt-1 text-xs leading-5 opacity-90">{subLabel}</span>
    </button>
  );
}

function HolidayCalendarPage({ marketId }) {
  const { data = [], loading, error, reload } = useApi(marketId ? `/markets/${marketId}/holidays` : null, { initialData: [] });
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '' });
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

  async function submit(event) {
    event.preventDefault();
    await mutate(`/markets/${marketId}/holidays`, form);
    setForm({ title: '', startDate: '', endDate: '' });
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <PageHeader
        title="ปฏิทินวันหยุดตลาด"
        description="ภาพรวมวันหยุดตลาดทั้งหมดและเพิ่มวันหยุดจากหน้าปฏิทิน"
        action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มวันหยุด</button>}
      />
      <Card>
        <ErrorNotice error={error} hint="ถ้า endpoint วันหยุดยังไม่พร้อม ปฏิทินจะแสดงเฉพาะโครง UI ก่อน" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(today)}</h2>
          <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">Month view</span>
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
      <Modal open={modalOpen} title="เพิ่มวันหยุด" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={saveError}>
          <TextInput label="ชื่อวันหยุด" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
          <DatePicker label="วันที่เริ่ม" value={form.startDate} onChange={(value) => setForm((current) => ({ ...current, startDate: value }))} required />
          <DatePicker label="วันที่สิ้นสุด" value={form.endDate} onChange={(value) => setForm((current) => ({ ...current, endDate: value }))} required />
        </FormPanel>
      </Modal>
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
  const [previewImage, setPreviewImage] = useState(null);
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
                    <SmallButton tone="slate" onClick={() => setPreviewImage(item)}><Eye size={14} /> ดู</SmallButton>
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
      <ImageLightbox image={previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
}

function ImageLightbox({ image, onClose }) {
  if (!image?.image_url) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 px-4 py-6" onClick={onClose}>
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-slate-950">{image.title || 'ตัวอย่างรูปภาพตลาด'}</h2>
            <p className="mt-1 text-xs text-slate-500">Preview</p>
          </div>
          <button data-subscription-ignore="true" type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <X size={22} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-76px)] overflow-auto bg-slate-950 p-4">
          <img src={image.image_url} alt={image.title || 'market'} className="mx-auto max-h-[calc(92vh-108px)] w-auto max-w-full rounded-2xl object-contain" />
        </div>
      </div>
    </div>
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
      <PageHeader title="บริการเสริม" description="แสดงรายการบริการเสริมของแต่ละตลาด" action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มบริการ</button>} />
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
  const rows = normalizeRows(data);
  if (!marketId) return <NeedMarket />;

  return (
    <>
      <PageHeader title="ประเภทสินค้า" description="ระบบใช้ประเภทสินค้าคงที่ 2 ประเภทสำหรับการกรอง Booth" action={<button onClick={reload} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">รีเฟรช</button>} />
      <Card>{loading ? <LoadingBlock /> : <DataTable columns={['ลำดับ', 'ชื่อประเภท', 'สถานะ']} rows={rows.map((item, index) => [index + 1, item.name, <StatusBadge value={item.status} />])} />}</Card>
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
      window.alert('กรุณาเลือกตลาดสำหรับข่าวสาร');
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
    });
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
    await mutate('/organization-settings', { ...form, vatRate: Number(form.vatRate || 0) }, 'PUT');
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
        </FormPanel>
      )}</Card>
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

const PASSWORD_POLICY_ITEMS = [
  'อย่างน้อย 10 ตัวอักษร',
  'มีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว',
  'มีตัวเลขอย่างน้อย 1 ตัว',
  'มีอักขระพิเศษอย่างน้อย 1 ตัว',
];

function isStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= 10
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function PasswordPolicyHint({ optional = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
      <div className="font-semibold text-slate-700">{optional ? 'นโยบายรหัสผ่านใหม่' : 'นโยบายรหัสผ่าน'}</div>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {PASSWORD_POLICY_ITEMS.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function validateTenantForm(form, mode = 'create') {
  if (!form.username || form.username.trim().length < 4) return 'Username ต้องมีอย่างน้อย 4 ตัวอักษร';
  if (mode === 'create' && !isStrongPassword(form.password)) return 'Password ต้องมีอย่างน้อย 10 ตัวอักษร และมีตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ';
  if (mode === 'edit' && form.password && !isStrongPassword(form.password)) return 'Password ใหม่ต้องมีอย่างน้อย 10 ตัวอักษร และมีตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ';
  if (!form.tenantTypeId) return 'กรุณาเลือกประเภทสมาชิก';
  if (!form.name || !form.name.trim()) return 'กรุณากรอกชื่อผู้เช่า';
  if (!/^\d{9,20}$/.test(String(form.phone || '').replace(/\D/g, ''))) return 'เบอร์โทรไม่ถูกต้อง';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email || '').trim())) return 'อีเมลไม่ถูกต้อง';
  if (!/^\d{13,20}$/.test(String(form.idCard || '').replace(/\D/g, ''))) return 'เลขบัตรประชาชนไม่ถูกต้อง';
  if (!form.address || form.address.trim().length < 5) return 'กรุณากรอกที่อยู่';
  return '';
}

function validateAdminForm(form, options = {}) {
  const requireUsername = options.requireUsername !== false;
  const requirePassword = options.requirePassword !== false;
  if (requireUsername && (!form.username || form.username.trim().length < 3)) return 'Username ต้องมีอย่างน้อย 3 ตัวอักษร';
  if (requirePassword && !isStrongPassword(form.password)) return 'Password ต้องมีอย่างน้อย 10 ตัวอักษร และมีตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ';
  if (!requirePassword && form.password && !isStrongPassword(form.password)) return 'Password ต้องมีอย่างน้อย 10 ตัวอักษร และมีตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ';
  if (!form.name || !form.name.trim()) return 'กรุณากรอกชื่อ';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email).trim())) return 'อีเมลไม่ถูกต้อง';
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
  const [form, setForm] = useState({ username: '', password: '', tenantTypeId: '', name: '', phone: '', email: '', idCard: '', address: '' });
  const [editForm, setEditForm] = useState({ username: '', password: '', tenantTypeId: '', name: '', phone: '', email: '', idCard: '', address: '', status: 'active' });
  const typeRows = normalizeRows(tenantTypes);
  const rows = normalizeRows(data).filter((item) => !status || item.status === status);

  function openCreateModal() {
    setTenantError('');
    setForm({ username: '', password: '', tenantTypeId: typeRows[0]?.id ? String(typeRows[0].id) : '', name: '', phone: '', email: '', idCard: '', address: '' });
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
    setForm({ username: '', password: '', tenantTypeId: '', name: '', phone: '', email: '', idCard: '', address: '' });
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
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>Password</Label><TextInputBare value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} type="password" /></div>
          <PasswordPolicyHint />
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
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center"><Label>Password ใหม่</Label><TextInputBare value={editForm.password} onChange={(value) => setEditForm((current) => ({ ...current, password: value }))} type="password" /><p className="text-xs text-slate-500">ปล่อยว่างถ้าไม่ต้องการเปลี่ยนรหัสผ่าน</p></div>
          <PasswordPolicyHint optional />
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
  const { token } = useAuth();
  const { mutate, loading: saving, error } = useMutation();
  const [form, setForm] = useState({ title: 'PDPA Consent', content: '', status: 'active' });
  const [editorError, setEditorError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    setForm({ title: data?.title || 'PDPA Consent', content: data?.content || '', status: data?.status || 'active' });
  }, [data]);

  async function submit(event) {
    event.preventDefault();
    setEditorError('');
    await mutate('/pdpa', form, 'PUT');
    reload();
  }

  async function uploadImage(file) {
    if (!file) return '';
    setUploadingImage(true);
    setEditorError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const payload = await request('/pdpa/assets', { method: 'POST', body, token });
      return payload.data?.imageUrl || '';
    } catch (uploadError) {
      setEditorError(uploadError.message || 'อัปโหลดรูปภาพไม่สำเร็จ');
      return '';
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <>
      <PageHeader title="จัดการ PDPA" description="จัดการข้อความ Consent PDPA ภายใต้องค์กร" />
      <Card>{loading ? <LoadingBlock /> : (
        <FormPanel onSubmit={submit} loading={saving} error={editorError || error}>
          <TextInput label="หัวข้อ" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
          <RichTextEditor label="รายละเอียด PDPA" value={form.content} onChange={(value) => setForm((current) => ({ ...current, content: value }))} onUploadImage={uploadImage} uploadingImage={uploadingImage} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'เปิดใช้งาน'], ['inactive', 'ปิดการใช้งาน']]} />
        </FormPanel>
      )}</Card>
    </>
  );
}

function BookingsPage({ marketId, mode }) {
  const today = new Date().toISOString().slice(0, 10);
  const [userQuery, setUserQuery] = useState('');
  const userPath = `/mobile-users${userQuery.trim() ? `?keyword=${encodeURIComponent(userQuery.trim())}` : ''}`;
  const { data = [], loading, reload } = useApi(marketId && mode !== 'edit' ? `/markets/${marketId}/bookings` : null, { initialData: [] });
  const { data: users = [] } = useApi(userPath, { initialData: [] });
  const { data: products = [] } = useApi(marketId ? `/markets/${marketId}/products` : null, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ mobileUserId: '', boothId: '', bookingDate: today, productId: '' });
  const [editDate, setEditDate] = useState(today);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ bookingDate: today, boothId: '', productId: '' });
  const [localError, setLocalError] = useState('');
  const { data: editItems = [], loading: editLoading, reload: reloadEditItems } = useApi(marketId && mode === 'edit' ? `/markets/${marketId}/booking-items?bookingDate=${editDate}` : null, { initialData: [] });
  const { data: editLogs = [], loading: editLogsLoading, reload: reloadEditLogs } = useApi(marketId && mode === 'history' ? `/markets/${marketId}/booking-edit-logs?limit=500` : null, { initialData: [] });
  const rows = normalizeRows(data);
  const userRows = normalizeRows(users);
  const productRows = normalizeRows(products);
  const availabilityPath = marketId && form.bookingDate && form.productId
    ? `/markets/${marketId}/bookings/booth-availability?bookingDate=${form.bookingDate}&productId=${form.productId}`
    : null;
  const { data: availability = [], loading: availabilityLoading, error: availabilityError, reload: reloadAvailability } = useApi(availabilityPath, { initialData: [] });
  const availabilityRows = normalizeRows(availability);
  const editAvailabilityPath = marketId && editModalOpen && editForm.bookingDate && editForm.productId && editItem?.id
    ? `/markets/${marketId}/bookings/booth-availability?bookingDate=${editForm.bookingDate}&productId=${editForm.productId}&excludeBookingItemId=${editItem.id}`
    : null;
  const { data: editAvailability = [], loading: editAvailabilityLoading, error: editAvailabilityError, reload: reloadEditAvailability } = useApi(editAvailabilityPath, { initialData: [] });
  const editAvailabilityRows = normalizeRows(editAvailability);

  useEffect(() => {
    setForm((current) => ({ ...current, boothId: '' }));
    setLocalError('');
  }, [form.bookingDate, form.productId]);

  useEffect(() => {
    setEditForm((current) => ({ ...current, boothId: '' }));
  }, [editForm.bookingDate]);

  if (!marketId) return <NeedMarket />;

  function userLabel(user) {
    return [user.name, user.phone, user.email, user.public_id].filter(Boolean).join(' / ');
  }

  function selectUser(user) {
    setForm((current) => ({ ...current, mobileUserId: String(user.id) }));
    setUserQuery(userLabel(user));
  }

  function openEdit(item) {
    const bookingDate = toDateInputValue(item.booking_date) || editDate;
    setEditItem(item);
    setEditForm({
      bookingDate,
      boothId: String(item.booth_id || ''),
      productId: String(item.product_id || productRows[0]?.id || ''),
    });
    setEditModalOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setLocalError('');
    if (!form.mobileUserId) {
      setLocalError('กรุณาเลือกผู้จองจากรายการ suggestion');
      return;
    }
    if (!form.productId) {
      setLocalError('กรุณาเลือกสินค้าก่อนเลือก Booth');
      return;
    }
    if (!form.boothId) {
      setLocalError('กรุณาเลือก Booth ที่ว่างอยู่');
      return;
    }
    await mutate(`/markets/${marketId}/bookings`, {
      mobileUserId: Number(form.mobileUserId || userRows[0]?.id),
      items: [{ boothId: Number(form.boothId), bookingDate: form.bookingDate, productIds: [Number(form.productId)] }],
    });
    setModalOpen(false);
    reload();
    reloadAvailability();
  }

  async function submitEdit(event) {
    event.preventDefault();
    setLocalError('');
    if (!editForm.boothId) {
      setLocalError('กรุณาเลือก Booth ที่ต้องการย้ายการจอง');
      return;
    }
    await mutate(`/markets/${marketId}/booking-items/${editItem.id}`, {
      bookingDate: editForm.bookingDate,
      boothId: Number(editForm.boothId),
    }, 'PATCH');
    setEditModalOpen(false);
    reloadEditItems();
    reloadEditAvailability();
  }

  async function deletePendingBooking(booking) {
    if (booking.status !== 'pending_payment') return;
    if (!window.confirm(`ลบรายการจองเลขที่ ${booking.public_id} ?`)) return;
    await mutate(`/markets/${marketId}/bookings/${booking.id}`, {}, 'DELETE');
    reload();
    reloadAvailability();
  }

  if (mode === 'history') {
    return (
      <>
        <PageHeader
          title="รายการแก้ไขการจอง"
          description="ประวัติรายการที่มีการเปลี่ยนวันที่หรือย้าย Booth"
          action={<button onClick={reloadEditLogs} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">รีเฟรช</button>}
        />
        <Card>
          {editLogsLoading ? <LoadingBlock /> : (
            <DataTable
              columns={['วันที่แก้ไข', 'เลขที่ใบจอง', 'ผู้จอง', 'แก้ไขจาก', 'แก้ไขเป็น', 'ราคาเดิม', 'ราคาใหม่', 'ผู้แก้ไข']}
              rows={normalizeRows(editLogs).map((item) => [
                formatDate(item.created_at),
                item.booking_public_id,
                item.mobile_name || item.mobile_public_id || '-',
                `${formatDate(item.old_booking_date)} / ${item.old_booth_code || item.old_booth_name || '-'}`,
                `${formatDate(item.new_booking_date)} / ${item.new_booth_code || item.new_booth_name || '-'}`,
                formatMoney(item.old_unit_price),
                formatMoney(item.new_unit_price),
                item.edited_by_name || '-',
              ])}
            />
          )}
        </Card>
      </>
    );
  }

  if (mode === 'edit') {
    return (
      <>
        <PageHeader
          title="แก้ไขการจอง"
          description="ค้นหารายการตามวันที่ แล้วแก้ไขวันจองหรือย้าย Booth ตามรูปแบบระบบเดิม"
          action={<div className="flex gap-2"><DatePickerBare value={editDate} onChange={setEditDate} /><button onClick={reloadEditItems} className="rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">ค้นหา</button></div>}
        />
        <Card>
          {editLoading ? <LoadingBlock /> : (
            <DataTable
              columns={['เลขที่ใบจอง', 'ผู้จอง', 'วันที่จอง', 'Booth', 'สินค้า', 'สถานะ', 'เวลาทำรายการ', 'จัดการ']}
              rows={normalizeRows(editItems).map((item) => [
                item.booking_public_id,
                item.mobile_name || item.mobile_public_id || '-',
                formatDate(item.booking_date),
                item.booth_name || item.booth_code || '-',
                item.product_name || '-',
                <StatusBadge value={item.booking_status} />,
                formatDate(item.created_at),
                <div className="flex flex-wrap gap-2">
                  <SmallButton tone="amber" onClick={() => openEdit(item)}>แก้ไข</SmallButton>
                </div>,
              ])}
            />
          )}
        </Card>
        <Modal open={editModalOpen} title="แก้ไขข้อมูลการเช่า" onClose={() => setEditModalOpen(false)}>
          <FormPanel onSubmit={submitEdit} loading={saving} error={localError || error || editAvailabilityError}>
            <div>
              <Label>เลขที่ใบจอง</Label>
              <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">{editItem?.booking_public_id || '-'}</div>
            </div>
            <DatePicker label="เลือกวันที่" value={editForm.bookingDate} onChange={(value) => setEditForm((current) => ({ ...current, bookingDate: value }))} required />
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-600" /> ว่าง</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> ถูกจองแล้ว</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> กำลังดำเนินการ/กำลังเลือก</span>
              </div>
              {editAvailabilityLoading ? (
                <LoadingBlock />
              ) : editAvailabilityRows.length ? (
                <div className="flex flex-wrap gap-4">
                  {editAvailabilityRows.map((booth) => {
                    const isSelected = String(editForm.boothId) === String(booth.id);
                    const status = isSelected ? 'selected' : booth.availability_status;
                    const canSelect = booth.availability_status === 'available';
                    return (
                      <BoothBox
                        key={booth.id}
                        tone={status}
                        label={booth.code || booth.name || booth.id}
                        subLabel={`${boothAvailabilityLabel(status)} / ${formatMoney(booth.gross_price ?? booth.price)}`}
                        disabled={!canSelect && !isSelected}
                        onClick={canSelect || isSelected ? () => setEditForm((current) => ({ ...current, boothId: String(booth.id) })) : undefined}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="ไม่พบ Booth ที่ย้ายได้" description="ตรวจสอบประเภทสินค้าของรายการจองหรือเลือกวันที่อื่น" />
              )}
            </div>
          </FormPanel>
        </Modal>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={mode === 'edit' ? 'แก้ไขการจอง' : mode === 'history' ? 'รายการแก้ไขการจอง' : 'การจอง'}
        description="จัดการรายการจองพื้นที่"
        action={<button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> จองแทนสมาชิก</button>}
      />
      <div className="grid gap-6">
        <ErrorNotice error={error} />
        <Card>{loading ? <LoadingBlock /> : <DataTable columns={['เลขที่', 'วันที่จอง', 'Booth', 'สถานะ', 'ยอดรวม', 'แหล่งที่มา', 'จำนวนรายการ', 'วันที่ทำรายการ', 'จัดการ']} rows={rows.map((booking) => [booking.public_id, booking.booking_dates || '-', booking.booths || '-', <StatusBadge value={booking.status} />, formatMoney(booking.total_amount), booking.source, booking.item_count, formatDate(booking.created_at), booking.status === 'pending_payment' ? <SmallButton tone="red" onClick={() => deletePendingBooking(booking)}>ลบ</SmallButton> : '-'])} />}</Card>
        <Modal open={modalOpen} title="สร้างการจองแทนลูกค้า" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={localError || error || availabilityError}>
          <label className="relative block">
            <span className="mb-1.5 block text-sm font-bold text-slate-600">ผู้จอง</span>
            <input value={userQuery} onChange={(event) => { setUserQuery(event.target.value); setForm((current) => ({ ...current, mobileUserId: '' })); }} placeholder="พิมพ์ชื่อ เบอร์โทร อีเมล หรือรหัสผู้จอง" className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
            {userQuery.trim() && !form.mobileUserId ? (
              <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                {userRows.length ? userRows.map((user) => (
                  <button key={user.id} type="button" onClick={() => selectUser(user)} className="block w-full px-4 py-3 text-left text-sm hover:bg-cyan-50">
                    <span className="block font-bold text-slate-800">{user.name || user.public_id}</span>
                    <span className="text-xs text-slate-500">{[user.phone, user.email, user.username].filter(Boolean).join(' / ')}</span>
                  </button>
                )) : <div className="px-4 py-3 text-sm text-slate-500">ไม่พบผู้จอง</div>}
              </div>
            ) : null}
          </label>
          <DatePicker label="วันที่จอง" value={form.bookingDate} onChange={(value) => setForm((current) => ({ ...current, bookingDate: value }))} required />
          <SelectInput label="สินค้า" value={form.productId} onChange={(value) => setForm((current) => ({ ...current, productId: value }))} options={[['', 'กรุณาเลือกสินค้า'], ...productRows.map((item) => [String(item.id), `${item.name}${item.category_name ? ` (${item.category_name})` : ''}`])]} />
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-600" /> ว่าง</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> ถูกจองแล้ว</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> กำลังดำเนินการ/กำลังเลือก</span>
            </div>
            {!form.productId ? (
              <EmptyState title="เลือกวันที่และสินค้าก่อน" description="ระบบจะกรอง Booth ตามประเภทสินค้าของสินค้าที่เลือก" />
            ) : availabilityLoading ? (
              <LoadingBlock />
            ) : availabilityRows.length ? (
              <div className="flex flex-wrap gap-4">
                {availabilityRows.map((booth) => {
                  const isSelected = String(form.boothId) === String(booth.id);
                  const status = isSelected ? 'selected' : booth.availability_status;
                  const canSelect = booth.availability_status === 'available';
                  return (
                    <BoothBox
                      key={booth.id}
                      tone={status}
                      label={booth.code || booth.name || booth.id}
                      subLabel={`${boothAvailabilityLabel(status)} / ${formatMoney(booth.gross_price ?? booth.price)}`}
                      disabled={!canSelect && !isSelected}
                      onClick={canSelect || isSelected ? () => setForm((current) => ({ ...current, boothId: isSelected ? '' : String(booth.id) })) : undefined}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState title="ไม่พบ Booth ที่ตรงกับสินค้า" description="ตรวจสอบประเภทสินค้าของ Booth หรือเลือกสินค้าอื่น" />
            )}
          </div>
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

function ReportsPage({ reportType }) {
  const { data: markets = [] } = useApi('/markets', { initialData: [] });
  const marketRows = normalizeRows(markets);
  const [range, setRange] = useState({ startDate: '2026-05-01', endDate: '2026-05-31' });
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

  const reportTitle = isAvailableBoothReport
    ? 'รายงาน Booth ว่าง'
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
        : 'รายการจองที่ยังไม่สำเร็จทั้งหมดตามวันที่จอง';

  const exportColumns = isAvailableBoothReport
    ? ['ลำดับ', 'ตลาด', 'วันที่', 'รหัส Booth', 'ชื่อ Booth', 'แผนผังบูธ', 'ประเภทสินค้า', 'ราคา', 'VAT', 'ราคารวม']
    : isProductTypesReport
      ? ['ลำดับที่', 'เลขที่ใบจอง', 'ประเภทสินค้าที่ขาย', 'ลูกค้า', 'วันที่ชำระเงิน', 'จำนวนเงินก่อน VAT']
    : isDailySalesReport || isCustomerBookingsReport
      ? ['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'Tell', 'ชื่อ Booth', 'สินค้าขาย', 'VAT', 'ยอดรวม', 'วันที่ขาย']
      : ['#', 'ตลาด', 'เลขจอง', 'วันที่จอง', 'Booth', 'สถานะ', 'แหล่งที่มา', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'ยอดรวม', 'วันที่ทำรายการ'];
  const exportRows = isAvailableBoothReport
    ? reportRows.map((row, index) => [index + 1, row.market_name || '-', formatDate(row.booking_date), row.booth_code || '-', row.booth_name || '-', row.floor_plan_name || '-', row.production_category_name || '-', formatMoney(row.price), formatMoney(row.vat_amount || 0), formatMoney(row.gross_price ?? row.price)])
    : isProductTypesReport
      ? reportRows.map((row, index) => [index + 1, row.booking_public_id || '-', row.product_names || '-', row.customer_name || '-', formatDate(row.paid_date), formatMoney(row.amount_before_vat || 0)])
    : isDailySalesReport || isCustomerBookingsReport
      ? reportRows.map((row, index) => [index + 1, row.booking_public_id || '-', row.market_name || '-', row.customer_name || '-', row.customer_phone || '-', row.booth_code || row.booth_name || '-', row.product_names || '-', formatMoney(row.vat_amount || 0), formatMoney(row.total_amount || 0), formatDate(row.booking_date)])
      : reportRows.map((row, index) => [index + 1, row.market_name || '-', row.booking_public_id || '-', formatDate(row.booking_date), row.booth_code || row.booth_name || '-', row.status || 'pending_payment', row.source || '-', formatMoney(row.subtotal_amount || 0), formatMoney(row.discount_amount || 0), formatMoney(row.vat_amount || 0), formatMoney(row.total_amount || 0), formatDate(row.created_at)]);

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
          <AvailableBoothReportTable rows={reportRows} />
        ) : isProductTypesReport ? (
          <DataTable columns={['ลำดับที่', 'เลขที่ใบจอง', 'ประเภทสินค้าที่ขาย', 'ลูกค้า', 'วันที่ชำระเงิน', 'จำนวนเงินก่อน VAT']} rows={reportRows.map((row, index) => [
            index + 1,
            row.booking_public_id || '-',
            row.product_names || '-',
            row.customer_name || '-',
            formatDate(row.paid_date),
            formatMoney(row.amount_before_vat || 0),
          ])} />
        ) : isDailySalesReport ? (
          <DailySalesReportTable rows={reportRows} />
        ) : isCustomerBookingsReport ? (
          selectedUser ? <DailySalesReportTable rows={reportRows} /> : <EmptyState title="กรุณาเลือกลูกค้า" description="พิมพ์ค้นหาแล้วเลือกจาก suggestion เพื่อดูรายการจอง" />
        ) : (
          <ReportTable rows={reportRows} />
        )}
      </Card>
    </>
  );
}

function AuditPage({ marketId, mode }) {
  const { user } = useAuth();
  const [range, setRange] = useState({ startDate: '2026-05-01', endDate: '2026-05-31' });
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
  if (!marketId) return <NeedMarket />;
  const reportRows = normalizeRows(data);
  const reportTitle = isFinePendingReport ? 'รายงานค่าปรับค้างจ่าย' : isFinePaidReport ? 'รายชื่อผู้จ่ายค่าปรับแบบโอน' : 'ข้อมูลการตรวจสอบตลาด';
  const exportColumns = isFinePendingReport || isFinePaidReport
    ? ['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'สถานะการตรวจสอบ', 'ค่าปรับ', 'VAT', 'จ่ายเงินเพิ่ม', 'ชื่อ Booth', 'สินค้าขาย', 'วันที่ขาย']
    : ['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'ผลตรวจ', 'ค่าปรับ', 'VAT', 'ยอดรวม', 'ชื่อ Booth', 'สินค้าขาย', 'วันที่ขาย'];
  const exportRows = reportRows.map((item, index) => isFinePendingReport || isFinePaidReport
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
              <DatePickerBare value={range.startDate} onChange={(value) => setRange((current) => ({ ...current, startDate: value }))} className="sm:w-[210px]" />
              <DatePickerBare value={range.endDate} onChange={(value) => setRange((current) => ({ ...current, endDate: value }))} className="sm:w-[210px]" />
              <ReportActionButton tone="slate" onClick={reload}>ค้นหา</ReportActionButton>
            </div>
            <ReportExportActions title={reportTitle} columns={exportColumns} rows={exportRows} disabled={!exportRows.length} />
          </ReportFiltersBar>
        )}
      />
      <Card>{loading ? <LoadingBlock /> : isFinePendingReport || isFinePaidReport ? <DataTable columns={['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'สถานะการตรวจสอบ', 'ค่าปรับ', 'VAT', 'จ่ายเงินเพิ่ม', 'ชื่อ Booth', 'สินค้าขาย', 'วันที่ขาย', 'จัดการ']} rows={reportRows.map((item, index) => [index + 1, item.booking_public_id, item.market_name || '-', item.customer_name || '-', auditResultLabel(item.result), formatMoney(Number(item.fine_amount || 0) + Number(item.accessories_fine_amount || 0) + Number(item.damage_fine_amount || 0)), formatMoney(item.vat_amount || 0), formatMoney(item.total_fine_amount), item.booth_code || item.booth_name || '-', item.product_names || '-', formatDate(item.booking_date), isFinePendingReport ? <SmallButton tone="amber" onClick={() => openPaymentModal(item)} disabled={saving}>ลูกค้าจ่ายแล้ว</SmallButton> : <StatusBadge value="paid" />])} /> : <DataTable columns={['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'ผลตรวจ', 'ค่าปรับ', 'VAT', 'ยอดรวม', 'ชื่อ Booth', 'สินค้าขาย', 'วันที่ขาย']} rows={reportRows.map((item, index) => [index + 1, item.booking_public_id, item.market_name || '-', item.customer_name || '-', auditResultLabel(item.result), formatMoney(Number(item.fine_amount || 0) + Number(item.accessories_fine_amount || 0) + Number(item.damage_fine_amount || 0)), formatMoney(item.vat_amount || 0), formatMoney(item.total_fine_amount), item.booth_code || item.booth_name || '-', item.product_names || '-', formatDate(item.booking_date)])} />}</Card>
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
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    marketId: '',
    dateField: 'payment_date',
    sortBy: 'payment_date',
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
  const columns = ['ลำดับที่', 'เลขที่ใบจอง', 'วันที่จัดงาน', 'ลูกค้า', 'วันที่ชำระเงิน', 'ค่าบริการ Booth', 'ค่าบริการอื่นๆ', 'จำนวนเงินก่อน VAT', 'ส่วนลด', 'VAT 7%', 'ภาษีหัก ณ ที่จ่าย', 'ยอดที่ต้องชำระเงิน', 'สถานะ', 'เหตุผล'];
  const exportRows = rows.map((item, index) => [
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
          {loading ? <LoadingBlock /> : <DataTable columns={columns} rows={rows.map((item, index) => [
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
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    marketId: '',
    dateField: 'payment_date',
    sortBy: 'payment_date',
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
  const columns = ['#', 'เลขที่ใบจอง', 'วันที่จัดงาน', 'ลูกค้า', 'วันที่ชำระเงิน', 'ค่าบริการ Booth', 'ค่าบริการอื่นๆ', 'ค่าปรับ', 'จำนวนก่อน Vat'];
  const exportRows = rows.map((item, index) => [
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
          {loading ? <LoadingBlock /> : <DataTable columns={columns} rows={rows.map((item, index) => [
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
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    asOfDate: '2026-05-31',
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
      columns: ['เลขชำระเงิน', 'Provider', 'Reference', 'เลขที่ใบจอง', 'ตลาด', 'สถานะชำระเงิน', 'สถานะจอง', 'ยอดชำระ', 'ยอดจอง', 'Callback', 'เอกสาร', 'ผลกระทบยอด', 'วันที่ทำรายการ'],
      row: (item) => [item.payment_public_id || '-', item.provider || '-', item.provider_reference || '-', item.booking_public_id || '-', item.market_name || '-', item.payment_status || '-', item.booking_status || '-', formatMoney(item.payment_amount || 0), formatMoney(item.booking_amount || 0), Number(item.callback_count || 0), item.document_no || '-', reconciliationLabel(item.reconciliation_status), formatDate(item.paid_at || item.created_at)],
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
  const exportRows = rows.map(config.row);

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
                <input value={filters.keyword} onChange={(event) => setFilter('keyword', event.target.value)} placeholder="ค้นหาเลขเอกสาร ลูกค้า ใบจอง หรือเลขชำระเงิน" className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
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
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    marketId: '',
    dateField: 'payment_date',
    sortBy: 'payment_date',
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
  const exportColumns = ['เลขชำระเงิน', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'Provider', 'สถานะ', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน'];
  const exportRows = rows.map((payment) => [payment.public_id, payment.booking_public_id || '-', payment.market_name || '-', payment.booking_dates || '-', payment.booths || '-', payment.customer_name || '-', payment.provider, payment.status || '-', formatMoney(payment.subtotal_amount || 0), formatMoney(payment.discount_amount || 0), formatMoney(payment.vat_amount || 0), formatMoney(payment.amount), formatDate(payment.paid_at || payment.created_at)]);

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
          {loading ? <LoadingBlock /> : <DataTable columns={['เลขชำระเงิน', 'เลขจอง', 'ตลาด', 'วันที่จอง', 'Booth', 'ลูกค้า', 'Provider', 'สถานะ', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'จำนวนเงิน', 'วันที่ชำระเงิน', 'จัดการ']} rows={rows.map((payment) => [
            payment.public_id,
            payment.booking_public_id || '-',
            payment.market_name || '-',
            payment.booking_dates || '-',
            payment.booths || '-',
            payment.customer_name || '-',
            payment.provider,
            <StatusBadge value={payment.status} />,
            formatMoney(payment.subtotal_amount || 0),
            formatMoney(payment.discount_amount || 0),
            formatMoney(payment.vat_amount || 0),
            formatMoney(payment.amount),
            formatDate(payment.paid_at || payment.created_at),
            <SmallButton tone={Number(payment.vat_enabled || 0) === 1 ? 'cyan' : 'amber'} onClick={() => issueAndPrintPaymentDocument(payment)} disabled={issuingDocument}>
              {payment.document_no || (Number(payment.vat_enabled || 0) === 1 ? 'ใบกำกับภาษี' : 'ใบเสร็จ')}
            </SmallButton>,
          ])} />}
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

function ReportTable({ rows }) {
  return <DataTable columns={['ลำดับ', 'ตลาด', 'เลขจอง', 'วันที่จอง', 'Booth', 'สถานะ', 'แหล่งที่มา', 'ยอดก่อนส่วนลด', 'ส่วนลด', 'VAT', 'ยอดรวม', 'วันที่ทำรายการ']} rows={rows.map((row, index) => [index + 1, row.market_name, row.booking_public_id || '-', formatDate(row.booking_date), row.booth_code || row.booth_name || '-', <StatusBadge value={row.status || 'pending_payment'} />, row.source || '-', formatMoney(row.subtotal_amount || row.booth_amount || 0), formatMoney(row.discount_amount || 0), formatMoney(row.vat_amount || 0), formatMoney(row.total_amount), formatDate(row.created_at)])} />;
}

function AvailableBoothReportTable({ rows }) {
  return <DataTable columns={['ลำดับ', 'ตลาด', 'วันที่', 'รหัส Booth', 'ชื่อ Booth', 'แผนผังบูธ', 'ประเภทสินค้า', 'ราคา', 'VAT', 'ราคารวม']} rows={rows.map((row, index) => [index + 1, row.market_name || '-', formatDate(row.booking_date), row.booth_code || '-', row.booth_name || '-', row.floor_plan_name || '-', row.production_category_name || '-', formatMoney(row.price), formatMoney(row.vat_amount || 0), formatMoney(row.gross_price ?? row.price)])} />;
}

function DailySalesReportTable({ rows }) {
  return <DataTable columns={['#', 'เลขที่ใบจอง', 'ตลาด', 'ชื่อผู้จอง', 'Tell', 'ชื่อ Booth', 'สินค้าขาย', 'VAT', 'ยอดรวม', 'วันที่ขาย']} rows={rows.map((row, index) => [index + 1, row.booking_public_id || '-', row.market_name || '-', row.customer_name || '-', row.customer_phone || '-', row.booth_code || row.booth_name || '-', row.product_names || '-', formatMoney(row.vat_amount || 0), formatMoney(row.total_amount || 0), formatDate(row.booking_date)])} />;
}

function PaymentList({ rows }) {
  if (!rows?.length) return <EmptyState />;
  return (
    <div className="space-y-3">
      {rows.slice(0, 8).map((payment) => (
        <div key={payment.id || payment.public_id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
          <div>
            <p className="font-bold text-slate-950">{payment.public_id}</p>
            <p className="text-sm text-slate-500">{payment.provider} · {payment.booking_dates || '-'} · {payment.booths || '-'}</p>
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

function ReportFiltersBar({ children }) {
  return <div className="flex w-full flex-col items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft sm:p-4 xl:w-auto xl:min-w-[720px]">{children}</div>;
}

function ReportActionButton({ children, tone = 'slate', onClick, disabled = false }) {
  const tones = {
    slate: 'bg-slate-950 text-white hover:bg-slate-800',
    cyan: 'bg-cyan-600 text-white hover:bg-cyan-700',
    amber: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
    red: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={classNames('inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50', tones[tone])}
    >
      {children}
    </button>
  );
}

function ReportExportActions({ title, columns, rows, disabled = false }) {
  return (
    <div className="flex flex-nowrap justify-end gap-2 overflow-x-auto">
      <ReportActionButton tone="cyan" onClick={() => exportReportExcel(title, columns, rows)} disabled={disabled}>
        <FileSpreadsheet size={16} />
        Excel
      </ReportActionButton>
      <ReportActionButton tone="amber" onClick={() => openReportPrintWindow(title, columns, rows, 'pdf')} disabled={disabled}>
        <FileText size={16} />
        PDF
      </ReportActionButton>
      <ReportActionButton tone="red" onClick={() => openReportPrintWindow(title, columns, rows, 'print')} disabled={disabled}>
        <Printer size={16} />
        พิมพ์
      </ReportActionButton>
    </div>
  );
}

function DataTable({ columns, rows }) {
  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows?.length]);

  if (!rows?.length) return <EmptyState />;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, rows.length);
  const pagedRows = rows.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
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
            {pagedRows.map((row, rowIndex) => (
              <tr key={`${currentPage}-${rowIndex}`} className="transition hover:bg-slate-50">
                {row.map((cell, cellIndex) => (
                  <td key={`${currentPage}-${rowIndex}-${cellIndex}`} className="border-b border-slate-100 px-4 py-4 align-middle text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <div>แสดง {startIndex + 1}-{endIndex} จาก {rows.length} รายการ</div>
        <div className="flex flex-wrap items-center gap-2">
          <span>หน้า {currentPage} / {totalPages}</span>
          <SmallButton tone="slate" onClick={() => setPage(1)} disabled={currentPage === 1}>หน้าแรก</SmallButton>
          <SmallButton tone="slate" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>ก่อนหน้า</SmallButton>
          <SmallButton tone="slate" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>ถัดไป</SmallButton>
          <SmallButton tone="slate" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>หน้าสุดท้าย</SmallButton>
        </div>
      </div>
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
          <button data-subscription-ignore="true" type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormPanel({ title, children, onSubmit, loading, error }) {
  const { actionBlocked, blockedMessage } = useSubscription();
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {title ? <h2 className="mb-5 text-lg font-extrabold text-slate-950">{title}</h2> : null}
      {children}
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {actionBlocked ? <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{blockedMessage}</div> : null}
      <button disabled={loading || actionBlocked} className="h-11 w-full rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? 'กำลังบันทึก...' : actionBlocked ? 'ไม่สามารถบันทึกได้' : 'บันทึก'}
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
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="relative">
      <input type={isPassword && visible ? 'text' : type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className={classNames('h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100', isPassword ? 'pr-11' : '')} />
      {isPassword ? (
        <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      ) : null}
    </div>
  );
}

function DatePicker({ label, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <DatePickerBare value={value} onChange={onChange} required={required} />
    </label>
  );
}

function DatePickerBare({ value, onChange, required = false, className = '' }) {
  return <input type="date" value={value} required={required} onChange={(event) => onChange(event.target.value)} className={classNames('h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100', className)} />;
}

function TimePicker({ label, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <input type="time" value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
    </label>
  );
}

function RichTextEditor({ label, value, onChange, onUploadImage, uploadingImage = false }) {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  function syncValue() {
    onChange(editorRef.current?.innerHTML || '');
  }

  function runCommand(command, commandValue = null) {
    editorRef.current?.focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, commandValue);
    syncValue();
  }

  function handleFormatBlock(tagName) {
    runCommand('formatBlock', `<${tagName}>`);
  }

  async function handleInsertLink() {
    const link = window.prompt('กรอก URL ที่ต้องการแทรก');
    if (!link) return;
    runCommand('createLink', link);
  }

  async function handleUploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUploadImage) return;
    const imageUrl = await onUploadImage(file);
    if (!imageUrl) return;
    runCommand('insertImage', imageUrl);
  }

  return (
    <label className="block">
      {label ? <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span> : null}
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-3">
          <select defaultValue="p" onChange={(event) => handleFormatBlock(event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600">
            <option value="p">ย่อหน้า</option>
            <option value="h1">หัวข้อใหญ่</option>
            <option value="h2">หัวข้อรอง</option>
            <option value="blockquote">ข้อความอ้างอิง</option>
          </select>
          <select defaultValue="Arial" onChange={(event) => runCommand('fontName', event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600">
            <option value="Arial">Arial</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Verdana">Verdana</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
          <select defaultValue="3" onChange={(event) => runCommand('fontSize', event.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600">
            <option value="2">เล็ก</option>
            <option value="3">ปกติ</option>
            <option value="4">กลาง</option>
            <option value="5">ใหญ่</option>
            <option value="6">ใหญ่มาก</option>
          </select>
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600">
            <Type size={16} />
            <input type="color" defaultValue="#0f172a" onChange={(event) => runCommand('foreColor', event.target.value)} className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0" />
          </div>
          <SmallButton tone="slate" onClick={() => runCommand('bold')}><Bold size={14} /> หนา</SmallButton>
          <SmallButton tone="slate" onClick={() => runCommand('italic')}><Italic size={14} /> เอียง</SmallButton>
          <SmallButton tone="slate" onClick={() => runCommand('underline')}><Underline size={14} /> ขีดเส้นใต้</SmallButton>
          <SmallButton tone="slate" onClick={() => handleFormatBlock('h1')}><Heading1 size={14} /> หัวข้อ</SmallButton>
          <SmallButton tone="slate" onClick={() => runCommand('insertUnorderedList')}><List size={14} /> Bullet</SmallButton>
          <SmallButton tone="slate" onClick={() => runCommand('insertOrderedList')}><ListOrdered size={14} /> Number</SmallButton>
          <SmallButton tone="slate" onClick={handleInsertLink}><Link2 size={14} /> ลิงก์</SmallButton>
          <SmallButton tone="slate" onClick={() => imageInputRef.current?.click()}>{uploadingImage ? 'กำลังอัปโหลด...' : <><ImagePlus size={14} /> รูปภาพ</>}</SmallButton>
          <SmallButton tone="slate" onClick={() => runCommand('undo')}><Undo2 size={14} /></SmallButton>
          <SmallButton tone="slate" onClick={() => runCommand('redo')}><Redo2 size={14} /></SmallButton>
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleUploadImage} />
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncValue}
          className="min-h-[360px] w-full px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">รองรับการจัดหน้า ปรับฟอนต์ ปรับตัวหนังสือ แทรกรูปภาพ และแทรกลิงก์ โดยบันทึกเป็นเนื้อหา HTML</p>
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

function SmallButton({ children, tone = 'slate', onClick, disabled = false }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-100',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100',
  };
  return <button type="button" disabled={disabled} onClick={onClick} className={classNames('inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50', tones[tone])}>{children}</button>;
}

function OutlineButton({ children, tone = 'amber', onClick, disabled = false }) {
  const tones = {
    cyan: 'border-cyan-300 text-cyan-700 hover:bg-cyan-50',
    amber: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    red: 'border-red-300 text-red-700 hover:bg-red-50',
  };
  return <button type="button" disabled={disabled} onClick={onClick} className={classNames('inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50', tones[tone])}>{children}</button>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
    </Routes>
  );
}
