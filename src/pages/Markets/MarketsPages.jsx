import { useEffect, useState } from 'react';
import { Eye, Image, Plus, X } from 'lucide-react';
import { request } from '../../api/client.js';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { useAuth } from '../../state/auth.jsx';
import { classNames, formatDate, formatMoney, normalizeRows } from '../../utils/formatters.js';
import { combineOpeningHours, dateKeyFromUtcTime, dateKeyFromValue, splitOpeningHours, utcTimeFromDateKey } from '../../utils/management.js';
import { showConfirm } from '../../utils/alerts.js';
import { BoothBox, DatePicker, ErrorNotice, FileInput, FileSummary, FormPanel, Label, Modal, NeedMarket, OutlineButton, SelectInput, SmallButton, TextInput, TextInputBare, TimePicker, Toolbar, RichTextEditor, FilterPill } from '../../components/ManagementUi.jsx';

const OPEN_DAY_OPTIONS = [
  ['sun', 'อาทิตย์'],
  ['mon', 'จันทร์'],
  ['tue', 'อังคาร'],
  ['wed', 'พุธ'],
  ['thu', 'พฤหัสบดี'],
  ['fri', 'ศุกร์'],
  ['sat', 'เสาร์'],
];

const DEFAULT_OPEN_DAYS = OPEN_DAY_OPTIONS.map(([value]) => value);

function normalizeOpenDays(value) {
  if (Array.isArray(value)) return value.filter((item) => DEFAULT_OPEN_DAYS.includes(String(item)));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeOpenDays(parsed);
    } catch {}
  }
  return DEFAULT_OPEN_DAYS;
}

function formatOpenDaysThai(value) {
  const days = normalizeOpenDays(value);
  if (days.length === DEFAULT_OPEN_DAYS.length) return 'ทุกวัน';
  const labels = OPEN_DAY_OPTIONS.filter(([day]) => days.includes(day)).map(([, label]) => label);
  return labels.length ? labels.join(', ') : 'ทุกวัน';
}

function OpenDaysCheckboxGroup({ value = [], onChange }) {
  const selected = value.length ? value : DEFAULT_OPEN_DAYS;
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {OPEN_DAY_OPTIONS.map(([day, label]) => (
        <label key={day} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={selected.includes(day)}
            onChange={(event) => {
              const next = event.target.checked
                ? [...new Set([...selected, day])]
                : selected.filter((item) => item !== day);
              onChange(next.length ? next : DEFAULT_OPEN_DAYS);
            }}
            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

export function MarketsPage({ markets, reloadMarkets }) {
  const { token } = useAuth();
  const { mutate, loading, error } = useMutation();
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '', openDays: DEFAULT_OPEN_DAYS });
  const [mainImageFile, setMainImageFile] = useState(null);
  const rows = markets.filter((market) => `${market.code} ${market.name}`.toLowerCase().includes(keyword.toLowerCase()));

  async function openCreateModal() {
    setMainImageFile(null);
    setForm({ code: '', name: '', description: '', openDays: DEFAULT_OPEN_DAYS });
    setModalOpen(true);
    try {
      const payload = await request('/markets/next-code', { token });
      setForm((current) => ({ ...current, code: payload.data?.code || '' }));
    } catch {}
  }

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append('code', form.code);
    payload.append('name', form.name);
    payload.append('description', form.description);
    payload.append('openDays', JSON.stringify(form.openDays?.length ? form.openDays : DEFAULT_OPEN_DAYS));
    if (mainImageFile) payload.append('mainImage', mainImageFile);
    await mutate('/markets', payload);
    setForm({ code: '', name: '', description: '', openDays: DEFAULT_OPEN_DAYS });
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
            columns={['ลำดับ', 'รหัสตลาด', 'ชื่อตลาด', 'วันเปิดตลาด', 'สถานะ']}
            rows={rows.map((market, index) => [
              index + 1,
              market.code || '-',
              market.name,
              formatOpenDaysThai(market.open_days_json),
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
          <div>
            <Label>วันเปิดตลาด</Label>
            <div className="mt-2">
              <OpenDaysCheckboxGroup value={form.openDays} onChange={(value) => setForm((current) => ({ ...current, openDays: value }))} />
            </div>
          </div>
        </FormPanel>
        </Modal>
      </div>
    </>
  );
}

export function MarketInfoPage({ marketId, market, reloadMarkets }) {
  const { mutate, loading, error } = useMutation();
  const openingHours = splitOpeningHours(market?.opening_hours || '08:30-17:30');
  const [form, setForm] = useState({
    name: market?.name || '',
    description: market?.description || '',
    address: market?.address || '',
    openingStart: openingHours.openingStart,
    openingEnd: openingHours.openingEnd,
    openDays: normalizeOpenDays(market?.open_days_json),
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
      openDays: normalizeOpenDays(market?.open_days_json),
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
    payload.append('openDays', JSON.stringify(form.openDays?.length ? form.openDays : DEFAULT_OPEN_DAYS));
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
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
            <Label>วันเปิดตลาด</Label>
            <OpenDaysCheckboxGroup value={form.openDays} onChange={(value) => setForm((current) => ({ ...current, openDays: value }))} />
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

export function BoothTypesPage({ marketId }) {
  const { data = [], loading, error, reload } = useApi(marketId ? `/markets/${marketId}/booth-types` : null, { initialData: [] });
  const { data: categories = [] } = useApi(marketId ? `/markets/${marketId}/categories` : null, { initialData: [] });
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [editingBoothType, setEditingBoothType] = useState(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', boothCount: '1', defaultPrice: '500', categoryId: '', status: 'active' });
  const [editForm, setEditForm] = useState({ name: '', startDate: '', endDate: '', status: 'active' });
  const [copyForm, setCopyForm] = useState({ sourceBoothTypeId: '', name: '', startDate: '', endDate: '', status: 'active' });
  const [planImageFile, setPlanImageFile] = useState(null);
  const [editPlanImageFile, setEditPlanImageFile] = useState(null);
  const [copyPlanImageFile, setCopyPlanImageFile] = useState(null);
  const rows = normalizeRows(data);
  const categoryRows = normalizeRows(categories);

  if (!marketId) return <NeedMarket />;

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('startDate', form.startDate);
    payload.append('endDate', form.endDate);
    payload.append('boothCount', form.boothCount);
    payload.append('defaultPrice', form.defaultPrice);
    if (form.categoryId) payload.append('categoryId', form.categoryId);
    payload.append('status', form.status);
    if (planImageFile) payload.append('planImage', planImageFile);
    await mutate(`/markets/${marketId}/booth-types`, payload);
    setForm({ name: '', startDate: '', endDate: '', boothCount: '1', defaultPrice: '500', categoryId: '', status: 'active' });
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
              columns={['ลำดับ', 'ผังภาพรวม', 'ชื่อแบบ', 'จำนวนบูธ', 'เริ่มต้น', 'สิ้นสุด', 'สถานะ', 'จัดการ']}
              rows={rows.map((item, index) => [
                index + 1,
                item.plan_image_url ? <img src={item.plan_image_url} className="h-16 w-24 rounded-xl object-cover" /> : <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-400">ไม่มีผัง</div>,
                item.name || item.title,
                Number(item.booth_count || 0),
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
          <TextInput label="จำนวนบูธในแผนผัง" type="number" value={form.boothCount} onChange={(value) => setForm((current) => ({ ...current, boothCount: value }))} required />
          <TextInput label="ราคาตั้งต้นของบูธ" type="number" value={form.defaultPrice} onChange={(value) => setForm((current) => ({ ...current, defaultPrice: value }))} required />
          <SelectInput
            label="หมวดหมู่สินค้าตั้งต้น"
            value={form.categoryId}
            onChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}
            options={[['', 'ไม่ระบุ'], ...categoryRows.map((item) => [String(item.id), item.name])]}
          />
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

export function BoothsPage({ marketId }) {
  const { token } = useAuth();
  const { data = [], loading, error, reload } = useApi(marketId ? `/markets/${marketId}/booths` : null, { initialData: [] });
  const { data: categories = [] } = useApi(marketId ? `/markets/${marketId}/categories` : null, { initialData: [] });
  const { data: boothTypes = [] } = useApi(marketId ? `/markets/${marketId}/booth-types?status=active` : null, { initialData: [] });
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
  const [selectedBoothIds, setSelectedBoothIds] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ categoryId: '', price: '' });

  useEffect(() => {
    if (selectedType && !typeRows.some((item) => String(item.id) === String(selectedType))) {
      setSelectedType(typeRows[0]?.id ? String(typeRows[0].id) : '');
      return;
    }
    if (!selectedType && typeRows[0]?.id) {
      setSelectedType(String(typeRows[0].id));
    }
  }, [selectedType, typeRows]);

  useEffect(() => {
    setSelectedBoothIds([]);
  }, [selectedType, selectedCategory, marketId]);

  const filteredRows = rows.filter((booth) => {
    if (!selectedType) return false;
    if (String(booth.floor_plan_id || booth.floorPlanId || '') !== String(selectedType)) return false;
    if (selectedCategory === 'all') return true;
    return String(booth.category_id || booth.categoryId || '') === String(selectedCategory);
  });
  const selectedFloorPlan = typeRows.find((item) => String(item.id) === String(selectedType));

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

  async function deleteBooth() {
    if (!editForm.id) return;
    const confirmed = await showConfirm({
      title: 'ยืนยันลบบูธ',
      text: 'บูธที่ลบแล้วจะยังแสดงในหน้าจัดการเป็นสีเทา',
      confirmButtonText: 'ลบบูธ',
    });
    if (!confirmed) return;
    await mutate(`/markets/${marketId}/booths/${editForm.id}`, null, 'DELETE');
    setEditModalOpen(false);
    setEditForm({ id: '', floorPlanId: '', categoryId: '', code: '', name: '', price: '500', sortOrder: '0', status: 'active' });
    reload();
  }

  function toggleBoothSelection(boothId) {
    setSelectedBoothIds((current) => (
      current.includes(boothId)
        ? current.filter((id) => id !== boothId)
        : [...current, boothId]
    ));
  }

  function selectAllVisible() {
    setSelectedBoothIds(filteredRows.filter((booth) => booth.status !== 'deleted').map((booth) => booth.id));
  }

  function clearSelection() {
    setSelectedBoothIds([]);
  }

  function openBulkModal() {
    setBulkForm({ categoryId: '', price: '' });
    setBulkModalOpen(true);
  }

  async function submitBulk(event) {
    event.preventDefault();
    const payload = {
      boothIds: selectedBoothIds,
    };
    if (bulkForm.categoryId !== '') payload.categoryId = bulkForm.categoryId === 'none' ? null : Number(bulkForm.categoryId);
    if (bulkForm.price !== '') payload.price = Number(bulkForm.price);
    await mutate(`/markets/${marketId}/booths/bulk`, payload, 'PATCH');
    setBulkModalOpen(false);
    clearSelection();
    reload();
  }

  return (
    <>
      <PageHeader
        title="จัดการบูธ"
        description="เลือกแผนผังบูธก่อน แล้วกรองตามประเภทสินค้าที่ผูกกับบูธ"
        action={(
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openBulkModal}
              disabled={!selectedBoothIds.length}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              แก้ไขหลายบูธ ({selectedBoothIds.length})
            </button>
            <button onClick={openCreateModal} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"><Plus size={16} /> เพิ่มบูธ</button>
          </div>
        )}
      />
      <Card>
        <ErrorNotice error={error} hint="ตรวจสอบ endpoint /markets/:marketId/booths และความสัมพันธ์ booths.category_id -> product_categories.id" />
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 px-2">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Floor plan</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{typeRows.length} แผนผังที่เปิดใช้งาน</p>
            </div>
            <div className="max-h-[376px] space-y-2 overflow-y-auto pr-1">
              {typeRows.length ? typeRows.map((item) => {
                const boothCount = rows.filter((booth) => String(booth.floor_plan_id || booth.floorPlanId || '') === String(item.id)).length;
                const isActive = String(selectedType) === String(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedType(String(item.id))}
                    className={classNames(
                      'w-full rounded-2xl border px-4 py-3 text-left transition',
                      isActive
                        ? 'border-cyan-200 bg-slate-200 text-cyan-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50',
                    )}
                  >
                    <span className="block truncate text-sm font-extrabold">{item.name}</span>
                    <span className={classNames('mt-1 block text-xs font-bold', isActive ? 'text-cyan-700' : 'text-slate-400')}>{boothCount} บูธ</span>
                  </button>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm font-bold text-slate-500">
                  ยังไม่มีแผนผังที่เปิดใช้งาน
                </div>
              )}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-950">{selectedFloorPlan?.name || 'เลือกแผนผังบูธ'}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">กรองประเภทสินค้าแล้วแสดงบูธด้านล่าง</p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <FilterPill active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')}>ทั้งหมด</FilterPill>
                {categoryRows.map((category) => (
                  <FilterPill key={category.id} active={String(selectedCategory) === String(category.id)} onClick={() => setSelectedCategory(String(category.id))}>
                    {category.name}
                  </FilterPill>
                ))}
              </div>
            </div>
            {selectedType && filteredRows.length ? (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-bold text-slate-600">เลือกแล้ว {selectedBoothIds.length} จาก {filteredRows.length} บูธ</p>
                <div className="flex flex-wrap gap-2">
                  <SmallButton tone="slate" onClick={selectAllVisible}>เลือกทั้งหมด</SmallButton>
                  <SmallButton tone="slate" onClick={clearSelection}>ล้างที่เลือก</SmallButton>
                </div>
              </div>
            ) : null}
            {!selectedType ? (
              <EmptyState title="ยังไม่ได้เลือกแผนผังบูธ" description="เลือกแผนผังบูธจากรายการด้านซ้ายก่อน เพื่อแสดงผังและรายการบูธ" />
            ) : loading ? <LoadingBlock /> : filteredRows.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                {filteredRows.map((booth) => (
                  <div
                    key={booth.id || booth.code || booth.name}
                    className={classNames(
                      'relative min-h-20 rounded-xl border-2 border-dashed p-2 text-center shadow-sm transition',
                      booth.status === 'deleted'
                        ? 'border-slate-300 bg-slate-300 text-slate-600'
                        : selectedBoothIds.includes(booth.id)
                          ? 'border-amber-300 bg-amber-500 text-white'
                          : booth.status !== 'active'
                            ? 'border-red-300 bg-red-500 text-white'
                            : 'border-cyan-200 bg-cyan-600 text-white hover:bg-cyan-700',
                    )}
                  >
                    {booth.status !== 'deleted' ? (
                      <label className="absolute left-1.5 top-1.5">
                        <input
                          type="checkbox"
                          checked={selectedBoothIds.includes(booth.id)}
                          onChange={() => toggleBoothSelection(booth.id)}
                          className="h-4 w-4 rounded border-white/70 text-amber-500 focus:ring-amber-300"
                        />
                      </label>
                    ) : null}
                    <button type="button" disabled={booth.status === 'deleted'} onClick={() => openEditModal(booth)} className="flex h-full w-full flex-col items-center justify-center pt-3 disabled:cursor-default">
                      <span className="max-w-full truncate text-sm font-extrabold">{booth.code || booth.name || booth.id}</span>
                      <span className="mt-0.5 text-[11px] font-bold leading-4 opacity-95">{formatMoney(booth.price || 0)}</span>
                      <span className="mt-0.5 max-w-full truncate text-[10px] leading-4 opacity-80">{booth.status === 'deleted' ? 'ลบแล้ว' : booth.category_name || 'ยังไม่ระบุ'}</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="ไม่พบบูธตามเงื่อนไข" description="แผนผังบูธนี้ยังไม่มีบูธ หรือไม่มีบูธในประเภทที่เลือก" />
            )}
          </section>
        </div>
      </Card>
      <Modal open={modalOpen} title="เพิ่มบูธ" onClose={() => setModalOpen(false)}>
        <FormPanel onSubmit={submit} loading={saving} error={saveError}>
          <SelectInput label="แผนผังบูธ" value={form.floorPlanId || selectedType || typeRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, floorPlanId: value }))} options={typeRows.map((item) => [String(item.id), item.name])} />
          <SelectInput label="ประเภทสินค้า" value={form.categoryId || categoryRows[0]?.id || ''} onChange={(value) => setForm((current) => ({ ...current, categoryId: value }))} options={categoryRows.map((item) => [String(item.id), item.name])} />
          <TextInput label="รหัสบูธ" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} required />
          <TextInput label="ชื่อบูธ" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="ราคา" type="number" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} />
          <SelectInput label="สถานะ" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[['active', 'ใช้งาน'], ['inactive', 'ปิดการใช้งาน'], ['maintenance', 'ซ่อมบำรุง']]} />
        </FormPanel>
      </Modal>
      <Modal open={bulkModalOpen} title="แก้ไขหลายบูธ" onClose={() => setBulkModalOpen(false)}>
        <FormPanel onSubmit={submitBulk} loading={saving} error={saveError}>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">เลือกบูธแล้ว {selectedBoothIds.length} รายการ</div>
          <SelectInput
            label="เปลี่ยนหมวดหมู่สินค้า"
            value={bulkForm.categoryId}
            onChange={(value) => setBulkForm((current) => ({ ...current, categoryId: value }))}
            options={[['', 'ไม่เปลี่ยนหมวดหมู่'], ['none', 'ไม่ระบุหมวดหมู่'], ...categoryRows.map((item) => [String(item.id), item.name])]}
          />
          <TextInput label="กำหนดราคาใหม่" type="number" value={bulkForm.price} onChange={(value) => setBulkForm((current) => ({ ...current, price: value }))} />
        </FormPanel>
      </Modal>
      <Modal open={editModalOpen} title="แก้ไขบูธ" onClose={() => setEditModalOpen(false)}>
        <FormPanel onSubmit={submitEdit} loading={saving} error={saveError}>
          {editForm.status !== 'deleted' ? (
            <div className="flex justify-end">
              <SmallButton tone="red" onClick={deleteBooth} disabled={saving}>ลบบูธ</SmallButton>
            </div>
          ) : null}
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


export function HolidayCalendarPage({ marketId }) {
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

export function MarketImagesPage({ marketId }) {
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

  function nextImageSortOrder() {
    return String(rows.reduce((maxOrder, item) => Math.max(maxOrder, Number(item.sort_order ?? item.sortOrder ?? -1)), -1) + 1);
  }

  function openCreateModal() {
    setForm({ title: '', sortOrder: nextImageSortOrder(), status: 'active' });
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
    setForm({ title: '', sortOrder: nextImageSortOrder(), status: 'active' });
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

export function AccessoriesPage({ marketId }) {
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
