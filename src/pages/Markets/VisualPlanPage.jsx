import { useEffect, useMemo, useState } from 'react';
import { Box, Monitor, Plus, RotateCcw, Save, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { LoadingBlock } from '../../components/LoadingBlock.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  ErrorNotice,
  FormPanel,
  Modal,
  NeedMarket,
  SearchInput,
  SmallButton,
  TextInput,
  TextInputBare,
} from '../../components/ManagementUi.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { showAlert, showConfirm } from '../../utils/alerts.js';
import { classNames, formatMoney, normalizeRows } from '../../utils/formatters.js';

const VISUAL_PLAN_OBJECTS = [
  { type: 'booth', label: 'บูธ / ล็อกขายของ', rowSpan: 1, colSpan: 1 },
  { type: 'entrance', label: 'ทางเข้า', rowSpan: 1, colSpan: 3 },
  { type: 'exit', label: 'ทางออก', rowSpan: 1, colSpan: 3 },
  { type: 'toilet', label: 'ห้องน้ำ', rowSpan: 2, colSpan: 2 },
  { type: 'tree', label: 'ต้นไม้', rowSpan: 1, colSpan: 1 },
  { type: 'rest_area', label: 'จุดพัก', rowSpan: 2, colSpan: 3 },
  { type: 'stage', label: 'เวที', rowSpan: 2, colSpan: 4 },
  { type: 'parking', label: 'ที่จอดรถ', rowSpan: 2, colSpan: 4 },
  { type: 'text', label: 'ข้อความ / ป้าย', rowSpan: 1, colSpan: 3 },
  { type: 'custom', label: 'วัตถุอิสระ', rowSpan: 1, colSpan: 2 },
];

const DEFAULT_LAYOUT_FORM = {
  name: '',
  description: '',
  rowsCount: '20',
  columnsCount: '30',
  cellSize: '48',
};

const DEFAULT_PROPERTIES_FORM = {
  label: '',
  row: '1',
  col: '1',
  rowSpan: '1',
  colSpan: '1',
};

function createLayoutJson(rowsCount, columnsCount, cellSize) {
  return {
    version: 1,
    rows: Number(rowsCount),
    columns: Number(columnsCount),
    cellSize: Number(cellSize),
    items: [],
  };
}

function createItemId(type) {
  return `${type}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function getObjectDefinition(type) {
  return VISUAL_PLAN_OBJECTS.find((item) => item.type === type) || VISUAL_PLAN_OBJECTS[0];
}

function getItemAtCell(items, row, col) {
  return (items || []).find((item) => (
    row >= Number(item.row)
    && row < (Number(item.row) + Number(item.rowSpan || 1))
    && col >= Number(item.col)
    && col < (Number(item.col) + Number(item.colSpan || 1))
  ));
}

function validatePlacement(items, candidate, rowsCount, columnsCount, ignoreId = '') {
  const row = Number(candidate.row);
  const col = Number(candidate.col);
  const rowSpan = Number(candidate.rowSpan || 1);
  const colSpan = Number(candidate.colSpan || 1);

  if (!Number.isInteger(row) || row < 1) return 'ตำแหน่งแถวไม่ถูกต้อง';
  if (!Number.isInteger(col) || col < 1) return 'ตำแหน่งคอลัมน์ไม่ถูกต้อง';
  if (!Number.isInteger(rowSpan) || rowSpan < 1) return 'rowSpan ไม่ถูกต้อง';
  if (!Number.isInteger(colSpan) || colSpan < 1) return 'colSpan ไม่ถูกต้อง';
  if ((row + rowSpan - 1) > Number(rowsCount)) return 'วัตถุเกินจำนวนแถวของแผนผัง';
  if ((col + colSpan - 1) > Number(columnsCount)) return 'วัตถุเกินจำนวนคอลัมน์ของแผนผัง';

  for (const item of items || []) {
    if (item.id === ignoreId) continue;
    const intersects = !(
      (row + rowSpan - 1) < Number(item.row)
      || row > (Number(item.row) + Number(item.rowSpan || 1) - 1)
      || (col + colSpan - 1) < Number(item.col)
      || col > (Number(item.col) + Number(item.colSpan || 1) - 1)
    );
    if (intersects) return 'ตำแหน่งนี้มีวัตถุอยู่แล้ว';
  }
  return '';
}

function buildItemStyle(item, cellSize) {
  return {
    left: `${(Number(item.col) - 1) * cellSize}px`,
    top: `${(Number(item.row) - 1) * cellSize}px`,
    width: `${Number(item.colSpan || 1) * cellSize}px`,
    height: `${Number(item.rowSpan || 1) * cellSize}px`,
  };
}

function get3DItemStyle(item, cellSize) {
  const baseStyle = buildItemStyle(item, cellSize);
  const depth = item.type === 'booth' ? 10 : 14;
  const shadowColor = item.type === 'booth' ? '#059669' : '#0891b2';
  return {
    ...baseStyle,
    transform: `translateZ(${depth}px)`,
    boxShadow: `0 ${depth}px 0 ${shadowColor}, 0 ${depth + 8}px 18px rgba(15, 23, 42, 0.28)`,
  };
}

function VisualPlanObjectButton({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'w-full rounded-2xl border px-3 py-3 text-left text-sm font-bold transition',
        active
          ? 'border-cyan-600 bg-cyan-600 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50',
      )}
    >
      {item.label}
    </button>
  );
}

function LayoutListCard({ layout, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'w-full rounded-2xl border px-4 py-3 text-left transition',
        active ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200 bg-white hover:border-cyan-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-950">{layout.name}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {layout.rowsCount} x {layout.columnsCount} grid
          </p>
        </div>
        <StatusBadge value={layout.status || 'draft'} />
      </div>
    </button>
  );
}

export function VisualPlanPage({ marketId }) {
  const { data: layouts = [], loading: layoutsLoading, error: layoutsError, reload: reloadLayouts } = useApi(marketId ? `/markets/${marketId}/layouts` : null, { initialData: [] });
  const { data: booths = [], loading: boothsLoading, error: boothsError, reload: reloadBooths } = useApi(marketId ? `/markets/${marketId}/booths` : null, { initialData: [] });
  const { mutate, loading: saving, error: saveError } = useMutation();
  const layoutRows = normalizeRows(layouts);
  const boothRows = normalizeRows(booths).filter((row) => row.status !== 'deleted');

  const [selectedLayoutId, setSelectedLayoutId] = useState('');
  const { data: selectedLayout, loading: layoutLoading, error: layoutError, reload: reloadLayout } = useApi(
    marketId && selectedLayoutId ? `/markets/${marketId}/layouts/${selectedLayoutId}` : null,
    { initialData: null },
  );

  const [layoutForm, setLayoutForm] = useState(DEFAULT_LAYOUT_FORM);
  const [layoutDraft, setLayoutDraft] = useState(null);
  const [selectedTool, setSelectedTool] = useState('booth');
  const [selectedBoothId, setSelectedBoothId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [propertiesForm, setPropertiesForm] = useState(DEFAULT_PROPERTIES_FORM);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_LAYOUT_FORM);
  const [boothKeyword, setBoothKeyword] = useState('');
  const [planViewMode, setPlanViewMode] = useState('2d');
  const [planZoom, setPlanZoom] = useState(1);

  useEffect(() => {
    if (!layoutRows.length) {
      setSelectedLayoutId('');
      return;
    }
    if (!selectedLayoutId || !layoutRows.some((item) => String(item.id) === String(selectedLayoutId))) {
      setSelectedLayoutId(String(layoutRows[0].id));
    }
  }, [layoutRows, selectedLayoutId]);

  useEffect(() => {
    if (!selectedLayout?.id) {
      setLayoutDraft(null);
      setLayoutForm(DEFAULT_LAYOUT_FORM);
      setSelectedItemId('');
      setPropertiesForm(DEFAULT_PROPERTIES_FORM);
      return;
    }
    const nextRows = Number(selectedLayout.rowsCount || selectedLayout.layoutJson?.rows || 20);
    const nextColumns = Number(selectedLayout.columnsCount || selectedLayout.layoutJson?.columns || 30);
    const nextCellSize = Number(selectedLayout.cellSize || selectedLayout.layoutJson?.cellSize || 48);
    const nextLayoutJson = selectedLayout.layoutJson || createLayoutJson(nextRows, nextColumns, nextCellSize);
    setLayoutForm({
      name: selectedLayout.name || '',
      description: selectedLayout.description || '',
      rowsCount: String(nextRows),
      columnsCount: String(nextColumns),
      cellSize: String(nextCellSize),
    });
    setLayoutDraft({
      version: 1,
      rows: nextRows,
      columns: nextColumns,
      cellSize: nextCellSize,
      items: Array.isArray(nextLayoutJson.items) ? nextLayoutJson.items : [],
    });
    setSelectedItemId('');
    setPropertiesForm(DEFAULT_PROPERTIES_FORM);
  }, [selectedLayout]);

  const selectedItem = useMemo(
    () => (layoutDraft?.items || []).find((item) => item.id === selectedItemId) || null,
    [layoutDraft, selectedItemId],
  );

  useEffect(() => {
    if (!selectedItem) {
      setPropertiesForm(DEFAULT_PROPERTIES_FORM);
      return;
    }
    setPropertiesForm({
      label: selectedItem.label || '',
      row: String(selectedItem.row || 1),
      col: String(selectedItem.col || 1),
      rowSpan: String(selectedItem.rowSpan || 1),
      colSpan: String(selectedItem.colSpan || 1),
    });
  }, [selectedItem]);

  const placedBoothIds = useMemo(
    () => new Set((layoutDraft?.items || []).filter((item) => item.type === 'booth').map((item) => Number(item.boothId))),
    [layoutDraft],
  );

  const unplacedBooths = useMemo(() => {
    const keyword = boothKeyword.trim().toLowerCase();
    return boothRows
      .filter((booth) => !placedBoothIds.has(Number(booth.id)))
      .filter((booth) => {
        if (!keyword) return true;
        return `${booth.code || ''} ${booth.name || ''} ${booth.category_name || ''}`.toLowerCase().includes(keyword);
      });
  }, [boothKeyword, boothRows, placedBoothIds]);

  const canvasCellSize = useMemo(() => {
    const raw = Number(layoutDraft?.cellSize || layoutForm.cellSize || 48);
    return Math.max(28, Math.min(raw, 42));
  }, [layoutDraft, layoutForm.cellSize]);

  const canvasWidth = (layoutDraft?.columns || 0) * canvasCellSize;
  const canvasHeight = (layoutDraft?.rows || 0) * canvasCellSize;
  const scaledCanvasWidth = Math.max(canvasWidth * planZoom, 1);
  const scaledCanvasHeight = Math.max(canvasHeight * planZoom, 1);
  const is3DMode = planViewMode === '3d';

  if (!marketId) return <NeedMarket />;

  function syncLayoutMeta(patch) {
    setLayoutForm((current) => ({ ...current, ...patch }));
    setLayoutDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        rows: Number(patch.rowsCount ?? current.rows),
        columns: Number(patch.columnsCount ?? current.columns),
        cellSize: Number(patch.cellSize ?? current.cellSize),
      };
    });
  }

  async function createLayout(event) {
    event.preventDefault();
    const payload = await mutate(`/markets/${marketId}/layouts`, {
      name: createForm.name,
      description: createForm.description,
      rowsCount: Number(createForm.rowsCount),
      columnsCount: Number(createForm.columnsCount),
      cellSize: Number(createForm.cellSize),
    });
    setCreateModalOpen(false);
    setCreateForm(DEFAULT_LAYOUT_FORM);
    await reloadLayouts();
    if (payload?.id) setSelectedLayoutId(String(payload.id));
  }

  async function saveLayout() {
    if (!selectedLayoutId || !layoutDraft) return;
    await mutate(`/markets/${marketId}/layouts/${selectedLayoutId}`, {
      name: layoutForm.name,
      description: layoutForm.description,
      rowsCount: Number(layoutForm.rowsCount),
      columnsCount: Number(layoutForm.columnsCount),
      cellSize: Number(layoutForm.cellSize),
      layoutJson: {
        ...layoutDraft,
        rows: Number(layoutForm.rowsCount),
        columns: Number(layoutForm.columnsCount),
        cellSize: Number(layoutForm.cellSize),
      },
    }, 'PATCH');
    await Promise.all([reloadLayouts(), reloadLayout()]);
    await showAlert({ title: 'บันทึกแล้ว', text: 'อัปเดต Visual Plan เรียบร้อย', icon: 'success' });
  }

  async function publishLayout() {
    if (!selectedLayoutId) return;
    const confirmed = await showConfirm({
      title: 'เผยแพร่แผนผังนี้',
      text: 'ถ้ามีแผนผังที่เผยแพร่อยู่ ระบบจะถอดสถานะ published ออกจากรายการเดิม',
      confirmButtonText: 'เผยแพร่',
    });
    if (!confirmed) return;
    await mutate(`/markets/${marketId}/layouts/${selectedLayoutId}/publish`, {}, 'POST');
    await Promise.all([reloadLayouts(), reloadLayout()]);
  }

  async function archiveLayout() {
    if (!selectedLayoutId) return;
    const confirmed = await showConfirm({
      title: 'ย้ายแผนผังไปยัง archived',
      text: 'รายการนี้จะถูกซ่อนจากการใช้งานปกติของตลาดนี้',
      confirmButtonText: 'ยืนยัน',
    });
    if (!confirmed) return;
    await mutate(`/markets/${marketId}/layouts/${selectedLayoutId}`, null, 'DELETE');
    setSelectedLayoutId('');
    setSelectedItemId('');
    setLayoutDraft(null);
    await reloadLayouts();
  }

  function placeItemAtCell(row, col) {
    if (!layoutDraft) return;
    if (getItemAtCell(layoutDraft.items, row, col)) {
      setSelectedItemId(getItemAtCell(layoutDraft.items, row, col)?.id || '');
      return;
    }

    if (selectedTool === 'booth') {
      const booth = boothRows.find((item) => String(item.id) === String(selectedBoothId));
      if (!booth) {
        showAlert({ title: 'กรุณาเลือกบูธก่อน', text: 'เลือกบูธจริงจากรายการด้านขวาก่อนวางลงบน Grid', icon: 'warning' });
        return;
      }
      const nextItem = {
        id: createItemId('booth'),
        type: 'booth',
        boothId: Number(booth.id),
        boothCode: booth.code,
        label: booth.code || booth.name,
        row,
        col,
        rowSpan: 1,
        colSpan: 1,
      };
      const errorMessage = validatePlacement(layoutDraft.items, nextItem, layoutDraft.rows, layoutDraft.columns);
      if (errorMessage) {
        showAlert({ title: 'วางบูธไม่ได้', text: errorMessage, icon: 'warning' });
        return;
      }
      setLayoutDraft((current) => ({ ...current, items: [...current.items, nextItem] }));
      setSelectedItemId(nextItem.id);
      setSelectedBoothId('');
      return;
    }

    const definition = getObjectDefinition(selectedTool);
    const nextItem = {
      id: createItemId(definition.type),
      type: definition.type,
      label: definition.label,
      row,
      col,
      rowSpan: definition.rowSpan,
      colSpan: definition.colSpan,
    };
    const errorMessage = validatePlacement(layoutDraft.items, nextItem, layoutDraft.rows, layoutDraft.columns);
    if (errorMessage) {
      showAlert({ title: 'วางวัตถุไม่ได้', text: errorMessage, icon: 'warning' });
      return;
    }
    setLayoutDraft((current) => ({ ...current, items: [...current.items, nextItem] }));
    setSelectedItemId(nextItem.id);
  }

  function updateSelectedItem() {
    if (!selectedItem || !layoutDraft) return;
    const candidate = {
      ...selectedItem,
      label: selectedItem.type === 'booth' ? selectedItem.label : propertiesForm.label.trim() || selectedItem.label,
      row: Number(propertiesForm.row),
      col: Number(propertiesForm.col),
      rowSpan: Number(propertiesForm.rowSpan),
      colSpan: Number(propertiesForm.colSpan),
    };
    const errorMessage = validatePlacement(layoutDraft.items, candidate, layoutDraft.rows, layoutDraft.columns, selectedItem.id);
    if (errorMessage) {
      showAlert({ title: 'อัปเดตตำแหน่งไม่ได้', text: errorMessage, icon: 'warning' });
      return;
    }
    setLayoutDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === selectedItem.id ? candidate : item)),
    }));
    setSelectedItemId(candidate.id);
  }

  function removeSelectedItem() {
    if (!selectedItem || !layoutDraft) return;
    setLayoutDraft((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== selectedItem.id),
    }));
    setSelectedItemId('');
  }

  function updateZoom(nextZoom) {
    setPlanZoom(Math.max(0.5, Math.min(2, Number(nextZoom))));
  }

  const loading = layoutsLoading || boothsLoading || (selectedLayoutId && layoutLoading);
  const pageError = layoutsError || boothsError || layoutError || saveError;

  return (
    <>
      <PageHeader
        title="แผนผังตลาด / Visual Plan"
        description="นำบูธจริงที่สร้างไว้แล้วมาจัดวางลงบน Grid และบันทึกเป็นแผนผังตลาด"
        action={(
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateForm(DEFAULT_LAYOUT_FORM);
                setCreateModalOpen(true);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-700 shadow-soft ring-1 ring-slate-200"
            >
              <Plus size={16} />
              สร้าง layout
            </button>
            <button
              type="button"
              onClick={saveLayout}
              disabled={!selectedLayoutId || !layoutDraft || saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save size={16} />
              บันทึก layout
            </button>
          </div>
        )}
      />

      <Card>
        <ErrorNotice error={pageError} hint="ตรวจสอบ migration market_layouts และ endpoint /markets/:marketId/layouts" />
        {loading && !layoutDraft ? <LoadingBlock /> : null}
        {!loading && !layoutRows.length ? (
          <EmptyState title="ยังไม่มี Visual Plan" description="เริ่มจากสร้าง layout ใหม่สำหรับตลาดนี้ก่อน" />
        ) : null}

        {layoutRows.length ? (
          <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
            <aside className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Layouts</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">{layoutRows.length} รายการ</p>
                  </div>
                  {selectedLayout ? <StatusBadge value={selectedLayout.status || 'draft'} /> : null}
                </div>
                <div className="space-y-2">
                  {layoutRows.map((layout) => (
                    <LayoutListCard
                      key={layout.id}
                      layout={layout}
                      active={String(layout.id) === String(selectedLayoutId)}
                      onClick={() => setSelectedLayoutId(String(layout.id))}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Object toolbar</p>
                <div className="mt-3 space-y-2">
                  {VISUAL_PLAN_OBJECTS.map((item) => (
                    <VisualPlanObjectButton key={item.type} item={item} active={selectedTool === item.type} onClick={() => setSelectedTool(item.type)} />
                  ))}
                </div>
              </div>
            </aside>

            <section className="min-w-0 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_120px_120px]">
                  <TextInput label="ชื่อ layout" value={layoutForm.name} onChange={(value) => setLayoutForm((current) => ({ ...current, name: value }))} />
                  <TextInput label="คำอธิบาย" value={layoutForm.description} onChange={(value) => setLayoutForm((current) => ({ ...current, description: value }))} />
                  <TextInput label="Rows" type="number" value={layoutForm.rowsCount} onChange={(value) => syncLayoutMeta({ rowsCount: value })} />
                  <TextInput label="Columns" type="number" value={layoutForm.columnsCount} onChange={(value) => syncLayoutMeta({ columnsCount: value })} />
                  <TextInput label="Cell size" type="number" value={layoutForm.cellSize} onChange={(value) => syncLayoutMeta({ cellSize: value })} />
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  สถานะ {selectedLayout?.status || 'draft'}
                  {' • '}
                  แก้ไขล่าสุด {selectedLayout?.updatedAt ? new Date(selectedLayout.updatedAt).toLocaleString('th-TH') : '-'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SmallButton tone="slate" onClick={publishLayout}>เผยแพร่</SmallButton>
                  <SmallButton tone="red" onClick={archiveLayout}>ย้ายไป archive</SmallButton>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                {!layoutDraft ? (
                  <EmptyState title="ยังไม่ได้เลือก layout" description="เลือก layout จากรายการด้านซ้ายก่อน" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setPlanViewMode('2d')}
                          className={classNames(
                            'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-extrabold transition',
                            !is3DMode ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          <Monitor size={15} />
                          2D
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlanViewMode('3d')}
                          className={classNames(
                            'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-extrabold transition',
                            is3DMode ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          <Box size={15} />
                          3D
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateZoom(planZoom - 0.1)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                          aria-label="ซูมออก"
                        >
                          <ZoomOut size={16} />
                        </button>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={planZoom}
                          onChange={(event) => updateZoom(event.target.value)}
                          className="h-2 w-32 accent-cyan-600"
                          aria-label="ปรับซูมแผนผัง"
                        />
                        <button
                          type="button"
                          onClick={() => updateZoom(planZoom + 0.1)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                          aria-label="ซูมเข้า"
                        >
                          <ZoomIn size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateZoom(1)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                        >
                          <RotateCcw size={15} />
                          {Math.round(planZoom * 100)}%
                        </button>
                      </div>
                    </div>

                    <div className={classNames(
                      'overflow-auto rounded-2xl border border-slate-200 p-3',
                      is3DMode ? 'bg-slate-900' : 'bg-slate-50',
                    )}>
                      <div
                        className={classNames(
                          'relative',
                          is3DMode ? 'min-h-[520px] pt-10' : '',
                        )}
                        style={{
                          width: is3DMode ? `${Math.max(scaledCanvasWidth + 280, 760)}px` : `${scaledCanvasWidth}px`,
                          height: is3DMode ? `${Math.max(scaledCanvasHeight + 260, 560)}px` : `${scaledCanvasHeight}px`,
                          perspective: is3DMode ? '1200px' : undefined,
                        }}
                      >
                    <div
                      className={classNames(
                        'relative',
                        is3DMode ? 'bg-slate-100 shadow-2xl' : '',
                      )}
                      style={{
                        width: `${canvasWidth}px`,
                        height: `${canvasHeight}px`,
                        transform: is3DMode
                          ? `translate(${Math.max(120 * planZoom, 80)}px, ${Math.max(120 * planZoom, 80)}px) scale(${planZoom}) rotateX(58deg) rotateZ(-35deg)`
                          : `scale(${planZoom})`,
                        transformOrigin: 'top left',
                        transformStyle: is3DMode ? 'preserve-3d' : undefined,
                      }}
                    >
                      <div
                        className={classNames(
                          'grid',
                          is3DMode ? 'absolute inset-0 bg-white' : '',
                        )}
                        style={{
                          gridTemplateColumns: `repeat(${layoutDraft.columns}, minmax(0, ${canvasCellSize}px))`,
                          gridTemplateRows: `repeat(${layoutDraft.rows}, minmax(0, ${canvasCellSize}px))`,
                          transformStyle: is3DMode ? 'preserve-3d' : undefined,
                        }}
                      >
                        {Array.from({ length: layoutDraft.rows * layoutDraft.columns }).map((_, index) => {
                          const row = Math.floor(index / layoutDraft.columns) + 1;
                          const col = (index % layoutDraft.columns) + 1;
                          return (
                            <button
                              key={`${row}-${col}`}
                              type="button"
                              onClick={() => placeItemAtCell(row, col)}
                              className={classNames(
                                'h-full min-h-[28px] border transition hover:bg-cyan-50',
                                is3DMode ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white',
                              )}
                              aria-label={`วาง object ที่ row ${row} col ${col}`}
                            />
                          );
                        })}
                      </div>

                      {layoutDraft.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItemId(item.id)}
                          className={classNames(
                            'absolute overflow-hidden rounded-xl border-2 px-1 py-1 text-center shadow-sm transition',
                            item.type === 'booth'
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                              : 'border-cyan-300 bg-cyan-100 text-cyan-900',
                            selectedItemId === item.id ? 'ring-2 ring-amber-400 ring-offset-2' : '',
                            is3DMode ? 'shadow-xl' : '',
                          )}
                          style={is3DMode ? get3DItemStyle(item, canvasCellSize) : buildItemStyle(item, canvasCellSize)}
                        >
                          <div className="flex h-full w-full items-center justify-center text-xs font-extrabold">
                            <span className="truncate">{item.type === 'booth' ? item.boothCode || item.label : item.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Booth panel</p>
                <p className="mt-1 text-sm font-bold text-slate-500">บูธที่ generate แล้วและยังไม่ได้วาง</p>
                <div className="mt-3">
                  <SearchInput value={boothKeyword} onChange={setBoothKeyword} placeholder="ค้นหารหัสบูธ ชื่อบูธ หรือหมวดหมู่" />
                </div>
                {selectedTool === 'booth' ? (
                  <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                    {unplacedBooths.length ? unplacedBooths.map((booth) => (
                      <button
                        key={booth.id}
                        type="button"
                        onClick={() => setSelectedBoothId(String(booth.id))}
                        className={classNames(
                          'w-full rounded-2xl border px-3 py-3 text-left transition',
                          String(selectedBoothId) === String(booth.id)
                            ? 'border-cyan-600 bg-cyan-50'
                            : 'border-slate-200 bg-slate-50 hover:border-cyan-200 hover:bg-white',
                        )}
                      >
                        <p className="text-sm font-extrabold text-slate-950">{booth.code || booth.name}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{formatMoney(booth.price || 0)} • {booth.category_name || 'ไม่ระบุหมวดหมู่'}</p>
                      </button>
                    )) : (
                      <EmptyState title="บูธถูกวางครบแล้ว" description="ไม่มีบูธที่ยังวางไม่เสร็จใน layout นี้" />
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
                    เลือก object จาก toolbar แล้วคลิก cell บน Grid เพื่อวางลงแผนผัง
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Properties</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">แก้ไขตำแหน่งและขนาดของ object ที่เลือก</p>
                  </div>
                  {selectedItem ? (
                    <button
                      type="button"
                      onClick={removeSelectedItem}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
                {!selectedItem ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
                    คลิก object บน Grid เพื่อดูรายละเอียด
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedItem.type === 'booth' ? (
                      <>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-sm font-extrabold text-slate-950">{selectedItem.boothCode || selectedItem.label}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {formatMoney(boothRows.find((row) => Number(row.id) === Number(selectedItem.boothId))?.price || 0)}
                            {' • '}
                            {boothRows.find((row) => Number(row.id) === Number(selectedItem.boothId))?.category_name || 'ไม่ระบุหมวดหมู่'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <TextInputBare value={propertiesForm.label} onChange={(value) => setPropertiesForm((current) => ({ ...current, label: value }))} />
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextInput label="Row" type="number" value={propertiesForm.row} onChange={(value) => setPropertiesForm((current) => ({ ...current, row: value }))} />
                      <TextInput label="Column" type="number" value={propertiesForm.col} onChange={(value) => setPropertiesForm((current) => ({ ...current, col: value }))} />
                      <TextInput label="rowSpan" type="number" value={propertiesForm.rowSpan} onChange={(value) => setPropertiesForm((current) => ({ ...current, rowSpan: value }))} />
                      <TextInput label="colSpan" type="number" value={propertiesForm.colSpan} onChange={(value) => setPropertiesForm((current) => ({ ...current, colSpan: value }))} />
                    </div>

                    <SmallButton tone="slate" onClick={updateSelectedItem}>อัปเดตตำแหน่ง</SmallButton>
                  </div>
                )}
              </div>
            </aside>
          </div>
        ) : null}
      </Card>

      <Modal open={createModalOpen} title="สร้าง Visual Plan" onClose={() => setCreateModalOpen(false)}>
        <FormPanel onSubmit={createLayout} loading={saving} error={saveError}>
          <TextInput label="ชื่อ layout" value={createForm.name} onChange={(value) => setCreateForm((current) => ({ ...current, name: value }))} required />
          <TextInput label="คำอธิบาย" value={createForm.description} onChange={(value) => setCreateForm((current) => ({ ...current, description: value }))} />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextInput label="Rows" type="number" value={createForm.rowsCount} onChange={(value) => setCreateForm((current) => ({ ...current, rowsCount: value }))} required />
            <TextInput label="Columns" type="number" value={createForm.columnsCount} onChange={(value) => setCreateForm((current) => ({ ...current, columnsCount: value }))} required />
            <TextInput label="Cell size" type="number" value={createForm.cellSize} onChange={(value) => setCreateForm((current) => ({ ...current, cellSize: value }))} required />
          </div>
        </FormPanel>
      </Modal>
    </>
  );
}
