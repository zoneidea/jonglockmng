import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { normalizeRows } from '../../utils/formatters.js';
import { FormPanel, Modal, NeedMarket, SelectInput, TextInput } from '../../components/ManagementUi.jsx';

export function ProductCategoriesPage({ marketId }) {
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

export function ProductGroupsPage({ marketId }) {
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

export function ProductsPage({ marketId }) {
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
