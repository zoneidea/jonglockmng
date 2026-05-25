import { useEffect, useState } from 'react';
import { FileSpreadsheet, Image, Plus } from 'lucide-react';
import { request } from '../../api/client.js';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { downloadBookingImportTemplate } from '../../features/bookings/bookingImport.js';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { useAuth } from '../../state/auth.jsx';
import { classNames, formatDate, formatMoney, normalizeRows } from '../../utils/formatters.js';
import { boothAvailabilityLabel, toDateInputValue } from '../../utils/management.js';
import { BoothBox, DatePicker, DatePickerBare, ErrorNotice, FormPanel, Label, Modal, NeedMarket, RichTextEditor, SelectInput, SmallButton, TextInput, TextInputBare } from '../../components/ManagementUi.jsx';

export function PaymentProofReviewPage() {
  const [status, setStatus] = useState('waiting');
  const { data = [], loading, reload } = useApi(`/payment-proofs?status=${status}`, { initialData: [] });
  const { mutate, loading: saving, error } = useMutation();
  const rows = normalizeRows(data);

  async function review(payment, nextStatus) {
    await mutate(`/payments/${payment.id}/proof-status`, { status: nextStatus }, 'PATCH');
    reload();
  }

  return (
    <>
      <PageHeader title="ตรวจสลิปโอนเงิน" description="ตรวจหลักฐานการโอนเงินจากแอปฯ ก่อนยืนยันการชำระเงิน" />
      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            {[
              ['waiting', 'รอตรวจ'],
              ['failed', 'ไม่ผ่าน'],
              ['paid', 'ผ่านแล้ว'],
              ['all', 'ทั้งหมด'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={classNames('rounded-xl px-4 py-2 text-sm font-bold', status === value ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950')}
              >
                {label}
              </button>
            ))}
          </div>
          {error ? <div className="text-sm font-bold text-rose-600">{error}</div> : null}
        </div>
        {loading ? <LoadingBlock /> : (
          <DataTable
            columns={['เลขที่ใบจอง', 'ตลาด', 'ลูกค้า', 'ยอดเงิน', 'สถานะ', 'หลักฐาน', 'วันที่ส่ง', 'จัดการ']}
            rows={rows.map((item) => [
              item.booking_public_id || '-',
              item.market_name || '-',
              item.customer_name || '-',
              formatMoney(item.amount || 0),
              <StatusBadge value={item.status} />,
              item.proof_image_url ? <button type="button" onClick={() => window.open(item.proof_image_url, '_blank', 'noopener,noreferrer')} className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white">ดูสลิป</button> : '-',
              formatDate(item.proof_uploaded_at),
              item.status === 'waiting' ? (
                <div className="flex flex-wrap gap-2">
                  <button disabled={saving} type="button" onClick={() => review(item, 'paid')} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">ผ่าน</button>
                  <button disabled={saving} type="button" onClick={() => review(item, 'failed')} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">ไม่ผ่าน</button>
                </div>
              ) : '-',
            ])}
          />
        )}
      </Card>
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

export function BookingsPage({ marketId, mode }) {
  const today = new Date().toISOString().slice(0, 10);
  const { token } = useAuth();
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
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
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

  async function importBookingFile(file) {
    if (!file) return;
    setImporting(true);
    setLocalError('');
    setImportResult(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const payload = await request(`/markets/${marketId}/bookings/import`, { method: 'POST', body, token });
      setImportResult(payload.data);
      reload();
      reloadAvailability();
    } catch (importError) {
      setLocalError(importError.message || 'Import file ไม่สำเร็จ');
    } finally {
      setImporting(false);
    }
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
        action={(
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadBookingImportTemplate} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white">
              <FileSpreadsheet size={16} /> ดาวน์โหลดฟอร์แมต
            </button>
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-slate-950">
              <FileSpreadsheet size={16} /> {importing ? 'กำลัง Import...' : 'Import Excel'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={importing}
                onChange={(event) => {
                  importBookingFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </label>
            <button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> จองแทนสมาชิก</button>
          </div>
        )}
      />
      <div className="grid gap-6">
        <ErrorNotice error={localError || error} />
        {importResult ? (
          <Card className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">ผลการ Import Excel</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {`ทั้งหมด ${importResult.totalRows || 0} row, สำเร็จ ${importResult.successCount || 0} ใบจอง, error ${importResult.errorCount || 0} row`}
                </p>
              </div>
              <button type="button" onClick={() => setImportResult(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">ปิดผลลัพธ์</button>
            </div>
            {importResult.successes?.length ? (
              <DataTable
                columns={['ลูกค้า', 'เลขที่ใบจอง', 'จำนวนรายการ', 'ยอดรวม', 'แจ้งเตือน']}
                rows={importResult.successes.map((item) => [
                  item.customerIdentifier,
                  item.publicId,
                  item.itemCount,
                  formatMoney(item.totalAmount),
                  item.notificationQueued ? 'บันทึกแจ้งเตือนแล้ว' : '-',
                ])}
              />
            ) : null}
            {importResult.errors?.length ? (
              <DataTable
                columns={['Row', 'ลูกค้า', 'สาเหตุ']}
                rows={importResult.errors.map((item) => [item.rowNumber, item.customerIdentifier || '-', item.message])}
              />
            ) : null}
          </Card>
        ) : null}
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
