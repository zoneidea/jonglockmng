import { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Plus, Save, Trash2, Eye, Send, Grid3X3, LayoutGrid, DoorOpen, 
  TreePine, Presentation, Car, Type, Box, Eraser,
  MoreVertical, ZoomIn, ZoomOut, Monitor
} from 'lucide-react';
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
  SelectInput,
  SmallButton,
  TextInput,
} from '../../components/ManagementUi.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { showAlert, showConfirm } from '../../utils/alerts.js';
import { classNames, formatMoney, normalizeRows } from '../../utils/formatters.js';

function RestroomPairIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="4.5" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="4.5" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5.5 12.5 8 8l2.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 20h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 8v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.5 8h5l-1.2 6.5h-2.6L13.5 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 20h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// OBJECT DEFINITIONS WITH ICONS AND COLORS
// ============================================================================
const VISUAL_PLAN_OBJECTS = [
  { 
    type: 'booth', 
    label: 'บูธ / ล็อก', 
    description: 'พื้นที่จำหน่ายสินค้า',
    rowSpan: 1, 
    colSpan: 1,
    icon: LayoutGrid,
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-900',
    iconColor: 'text-emerald-600'
  },
  { 
    type: 'entrance', 
    label: 'ทางเข้า / ออก', 
    description: 'ประตูทางเข้าและทางออก',
    rowSpan: 1, 
    colSpan: 1,
    icon: DoorOpen,
    color: 'orange',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-900',
    iconColor: 'text-orange-600'
  },
  { 
    type: 'toilet', 
    label: 'ห้องน้ำ', 
    description: 'ห้องน้ำ / สุขา',
    rowSpan: 1, 
    colSpan: 1,
    icon: RestroomPairIcon,
    color: 'blue',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-600'
  },
  { 
    type: 'tree', 
    label: 'ต้นไม้', 
    description: 'ต้นไม้มงคล',
    rowSpan: 1, 
    colSpan: 1,
    icon: TreePine,
    color: 'green',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-900',
    iconColor: 'text-green-700'
  },
  { 
    type: 'stage', 
    label: 'เวที', 
    description: 'เวทีแสดง',
    rowSpan: 1, 
    colSpan: 1,
    icon: Presentation,
    color: 'purple',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-900',
    iconColor: 'text-purple-600'
  },
  { 
    type: 'parking', 
    label: 'ที่จอดรถ', 
    description: 'พื้นที่จอดรถ',
    rowSpan: 1, 
    colSpan: 1,
    icon: Car,
    color: 'slate',
    bgColor: 'bg-slate-200',
    borderColor: 'border-slate-400',
    textColor: 'text-slate-800',
    iconColor: 'text-slate-600'
  },
  { 
    type: 'text', 
    label: 'ข้อความ / ป้าย', 
    description: 'ป้ายบอกทาง / ข้อความ',
    rowSpan: 1, 
    colSpan: 1,
    icon: Type,
    color: 'pink',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
    textColor: 'text-pink-900',
    iconColor: 'text-pink-600'
  },
  { 
    type: 'custom', 
    label: 'วัตถุอิสระ', 
    description: 'วัตถุทั่วไป',
    rowSpan: 1, 
    colSpan: 1,
    icon: Box,
    color: 'gray',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-900',
    iconColor: 'text-gray-600'
  },
  {
    type: 'eraser', 
    label: 'ยางลบ', 
    description: 'ลบวัตถุออกจากแผนผัง',
    rowSpan: 1, 
    colSpan: 1,
    icon: Eraser,
    color: 'red',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-600'
  },
];

const DEFAULT_LAYOUT_FORM = {
  name: '',
  description: '',
  rowsCount: '20',
  columnsCount: '30',
  cellSize: '48',
};
const createDefaultCreateForm = () => ({ ...DEFAULT_LAYOUT_FORM, floorPlanId: '' });

const DEFAULT_PROPERTIES_FORM = {
  label: '',
  rowSpan: '1',
  colSpan: '1',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
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
  if (type === 'exit') {
    return VISUAL_PLAN_OBJECTS.find((item) => item.type === 'entrance') || VISUAL_PLAN_OBJECTS[0];
  }
  return VISUAL_PLAN_OBJECTS.find((item) => item.type === type) || VISUAL_PLAN_OBJECTS[0];
}

function getPaletteButtonClasses(type, active) {
  const classes = {
    booth: active
      ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50',
    entrance: active
      ? 'border-orange-600 bg-orange-600 text-white shadow-md'
      : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50',
    toilet: active
      ? 'border-blue-600 bg-blue-600 text-white shadow-md'
      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50',
    tree: active
      ? 'border-green-700 bg-green-700 text-white shadow-md'
      : 'border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50',
    stage: active
      ? 'border-purple-600 bg-purple-600 text-white shadow-md'
      : 'border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50',
    parking: active
      ? 'border-slate-700 bg-slate-700 text-white shadow-md'
      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
    text: active
      ? 'border-pink-600 bg-pink-600 text-white shadow-md'
      : 'border-slate-200 bg-white text-slate-700 hover:border-pink-200 hover:bg-pink-50',
    custom: active
      ? 'border-gray-600 bg-gray-600 text-white shadow-md'
      : 'border-slate-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-gray-50',
    eraser: active
      ? 'border-red-600 bg-red-600 text-white shadow-md'
      : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50',
  };
  return classes[type] || classes.custom;
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

const ISO_ITEM_COLORS = {
  booth: { top: '#d1fae5', stroke: '#6ee7b7', front: '#34d399', side: '#059669', text: '#064e3b' },
  entrance: { top: '#ffedd5', stroke: '#fdba74', front: '#fb923c', side: '#ea580c', text: '#c2410c' },
  toilet: { top: '#dbeafe', stroke: '#93c5fd', front: '#60a5fa', side: '#2563eb', text: '#1d4ed8' },
  tree: { top: '#dcfce7', stroke: '#86efac', front: '#4ade80', side: '#16a34a', text: '#166534' },
  stage: { top: '#f3e8ff', stroke: '#d8b4fe', front: '#c084fc', side: '#9333ea', text: '#6b21a8' },
  parking: { top: '#e2e8f0', stroke: '#94a3b8', front: '#cbd5e1', side: '#64748b', text: '#334155' },
  text: { top: '#fce7f3', stroke: '#f9a8d4', front: '#f472b6', side: '#db2777', text: '#9d174d' },
  custom: { top: '#f3f4f6', stroke: '#d1d5db', front: '#d1d5db', side: '#6b7280', text: '#374151' },
  eraser: { top: '#fee2e2', stroke: '#fca5a5', front: '#f87171', side: '#dc2626', text: '#991b1b' },
};

function pointString(points) {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
}

function getIsoItemColors(type) {
  return ISO_ITEM_COLORS[type] || ISO_ITEM_COLORS.custom;
}

function getIsoItemHeight(type) {
  if (type === 'booth') return 11;
  return 14;
}

function getIsoItemLabel(item) {
  const label = item.type === 'booth' ? (item.boothCode || item.label) : item.label;
  const text = String(label || getObjectDefinition(item.type).label || '').trim();
  return text.length > 10 ? `${text.slice(0, 9)}…` : text;
}

function createIsoMapModel(layoutDraft, cellSize, publishedMode) {
  const items = Array.isArray(layoutDraft?.items) ? layoutDraft.items : [];
  const rows = Number(layoutDraft?.rows || 1);
  const columns = Number(layoutDraft?.columns || 1);
  const tileWidth = cellSize * 1.62;
  const tileHeight = cellSize * 0.94;
  const marginCells = publishedMode ? 1 : 0;
  let minRow = 0;
  let minCol = 0;
  let maxRow = rows;
  let maxCol = columns;

  if (publishedMode && items.length) {
    minRow = Math.max(0, Math.min(...items.map((item) => Number(item.row || 1) - 1)) - marginCells);
    minCol = Math.max(0, Math.min(...items.map((item) => Number(item.col || 1) - 1)) - marginCells);
    maxRow = Math.min(rows, Math.max(...items.map((item) => Number(item.row || 1) - 1 + Number(item.rowSpan || 1))) + marginCells);
    maxCol = Math.min(columns, Math.max(...items.map((item) => Number(item.col || 1) - 1 + Number(item.colSpan || 1))) + marginCells);
  }

  const project = (rowEdge, colEdge) => ({
    x: (colEdge - rowEdge) * (tileWidth / 2),
    y: (colEdge + rowEdge) * (tileHeight / 2),
  });
  const floorPoints = [
    project(minRow, minCol),
    project(minRow, maxCol),
    project(maxRow, maxCol),
    project(maxRow, minCol),
  ];
  const projectedPoints = [...floorPoints];
  for (const item of items) {
    const row = Number(item.row || 1) - 1;
    const col = Number(item.col || 1) - 1;
    const rowSpan = Number(item.rowSpan || 1);
    const colSpan = Number(item.colSpan || 1);
    const depth = getIsoItemHeight(item.type);
    const corners = [
      project(row, col),
      project(row, col + colSpan),
      project(row + rowSpan, col + colSpan),
      project(row + rowSpan, col),
    ];
    projectedPoints.push(...corners, ...corners.map((point) => ({ x: point.x, y: point.y + depth })));
  }
  const minX = Math.min(...projectedPoints.map((point) => point.x));
  const maxX = Math.max(...projectedPoints.map((point) => point.x));
  const minY = Math.min(...projectedPoints.map((point) => point.y));
  const maxY = Math.max(...projectedPoints.map((point) => point.y));
  const padding = Math.max(72, cellSize * 2);

  return {
    minRow,
    minCol,
    maxRow,
    maxCol,
    tileWidth,
    tileHeight,
    project,
    floorPoints,
    viewBox: `${minX - padding} ${minY - padding} ${(maxX - minX) + (padding * 2)} ${(maxY - minY) + (padding * 2.4)}`,
  };
}

function normalizeLayoutForSave(layoutDraft, fallbackRows, fallbackColumns, fallbackCellSize) {
  const sourceItems = Array.isArray(layoutDraft?.items) ? layoutDraft.items : [];
  const cellSize = Number(layoutDraft?.cellSize || fallbackCellSize || 48);

  if (!sourceItems.length) {
    return {
      rows: Number(fallbackRows || layoutDraft?.rows || 20),
      columns: Number(fallbackColumns || layoutDraft?.columns || 30),
      cellSize,
      items: [],
      bounds: { minRow: 1, minCol: 1, maxRow: Number(fallbackRows || 20), maxCol: Number(fallbackColumns || 30) },
    };
  }

  const minRow = Math.min(...sourceItems.map((item) => Number(item.row || 1)));
  const minCol = Math.min(...sourceItems.map((item) => Number(item.col || 1)));
  const maxRow = Math.max(...sourceItems.map((item) => Number(item.row || 1) + Number(item.rowSpan || 1) - 1));
  const maxCol = Math.max(...sourceItems.map((item) => Number(item.col || 1) + Number(item.colSpan || 1) - 1));

  const normalizedItems = sourceItems.map((item) => ({
    ...item,
    row: Number(item.row || 1) - minRow + 2,
    col: Number(item.col || 1) - minCol + 2,
    rowSpan: Number(item.rowSpan || 1),
    colSpan: Number(item.colSpan || 1),
  }));

  return {
    rows: (maxRow - minRow + 1) + 2,
    columns: (maxCol - minCol + 1) + 2,
    cellSize,
    items: normalizedItems,
    bounds: { minRow, minCol, maxRow, maxCol },
  };
}

// ============================================================================
// UI COMPONENTS - LIST PAGE
// ============================================================================
function VisualPlanListCard({ layout, onClick }) {
  const placedCount = layout.placedBoothCount || 0;
  const totalCount = layout.boothCount || 0;
  const unplacedCount = totalCount - placedCount;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition-all hover:shadow-lg hover:border-cyan-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
              <Grid3X3 className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <p className="truncate text-base font-extrabold text-slate-950 group-hover:text-cyan-700">
                {layout.name}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                อ้างอิง: {layout.floorPlanName || 'ไม่ระบุ'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">บูธทั้งหมด</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">{totalCount}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-2">
              <p className="text-xs font-medium text-emerald-600">วางแล้ว</p>
              <p className="mt-1 text-lg font-extrabold text-emerald-700">{placedCount}</p>
            </div>
            <div className="rounded-2xl bg-orange-50 px-3 py-2">
              <p className="text-xs font-medium text-orange-600">ยังไม่ได้วาง</p>
              <p className="mt-1 text-lg font-extrabold text-orange-700">{unplacedCount}</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Grid:</span>
              {layout.rowsCount} x {layout.columnsCount}
            </span>
            <span>•</span>
            <span>{new Date(layout.updatedAt).toLocaleDateString('th-TH')}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <StatusBadge value={layout.status || 'draft'} />
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <SmallButton tone="cyan" onClick={(e) => { e.stopPropagation(); onClick(); }}>
              เข้าไปจัดแผนผัง
            </SmallButton>
          </div>
        </div>
      </div>
    </button>
  );
}

function VisualPlanListTable({ layouts, onEdit }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">ลำดับ</th>
              <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">ชื่อแผนผัง</th>
              <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">อ้างอิง</th>
              <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">บูธ</th>
              <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Grid</th>
              <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">สถานะ</th>
              <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">อัปเดตล่าสุด</th>
              <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {layouts.map((layout, index) => {
              const placedCount = layout.placedBoothCount || 0;
              const totalCount = layout.boothCount || 0;
              return (
                <tr key={layout.id} className="transition-colors hover:bg-cyan-50">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{index + 1}</td>
                  <td className="px-6 py-4 text-sm font-extrabold text-slate-950">{layout.name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{layout.floorPlanName || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-700">{placedCount}</span>
                      <span className="text-xs font-medium text-slate-400">/</span>
                      <span className="text-sm font-medium text-slate-600">{totalCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{layout.rowsCount} x {layout.columnsCount}</td>
                  <td className="px-6 py-4"><StatusBadge value={layout.status || 'draft'} /></td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">
                    {new Date(layout.updatedAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <SmallButton tone="cyan" onClick={() => onEdit(layout.id)}>จัดแผนผัง</SmallButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// UI COMPONENTS - EDITOR PAGE
// ============================================================================
function ObjectPaletteButton({ item, active, onClick }) {
  const IconComponent = item.icon;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'flex min-w-[112px] flex-col items-center justify-center rounded-2xl border px-3 py-3 text-center transition-all',
        getPaletteButtonClasses(item.type, active),
      )}
    >
      <div className={classNames(
        'flex h-10 w-10 items-center justify-center rounded-xl',
        active ? 'bg-white/20' : item.bgColor
      )}>
        <IconComponent className={classNames('h-5 w-5', active ? 'text-white' : item.iconColor)} />
      </div>
      <div className="mt-2 min-w-0">
        <p className={classNames('text-xs font-bold leading-4', active ? 'text-white' : 'text-slate-900')}>
          {item.label}
        </p>
      </div>
    </button>
  );
}

function EditorTopbar({
  layout,
  onSave,
  onPublish,
  onViewPreview,
  status,
  viewMode,
  onViewModeChange,
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
}) {
  const is3DMode = viewMode === '3d';

  return (
    <div className="sticky top-0 z-20 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
            <Grid3X3 className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-950">{layout.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge value={status || 'draft'} />
              <span className="text-xs font-medium text-slate-500">
                {layout.rowsCount} x {layout.columnsCount} grid
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewPreview}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
          >
            <Eye size={18} />
            ดูตัวอย่าง
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-bold text-white transition hover:bg-slate-900"
          >
            <Save size={18} />
            บันทึกร่าง
          </button>
          <button
            type="button"
            onClick={onPublish}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white transition hover:bg-cyan-700"
          >
            <Send size={18} />
            เผยแพร่
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewModeChange('2d')}
            className={classNames(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition',
              !is3DMode
                ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50',
            )}
          >
            <Monitor size={14} />
            2D Flat
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('3d')}
            className={classNames(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition',
              is3DMode
                ? 'border-cyan-600 bg-cyan-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50',
            )}
          >
            <Box size={14} />
            3D Interactive
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onZoomChange(zoom - 0.1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
            aria-label="ซูมออก"
          >
            <ZoomOut size={16} />
          </button>
          <span className="w-11 text-center text-xs font-bold text-slate-600">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => onZoomChange(zoom + 0.1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
            aria-label="ซูมเข้า"
          >
            <ZoomIn size={16} />
          </button>
          <div className="mx-2 h-5 w-px bg-slate-200"></div>
          <button
            type="button"
            onClick={onToggleGrid}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
          >
            <Grid3X3 size={14} />
            {showGrid ? 'ปิด Grid' : 'เปิด Grid'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export function VisualPlanPage({ marketId }) {
  // State management
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'editor'
  const [selectedLayoutId, setSelectedLayoutId] = useState('');
  const [layoutForm, setLayoutForm] = useState(DEFAULT_LAYOUT_FORM);
  const [layoutDraft, setLayoutDraft] = useState(null);
  const [selectedTool, setSelectedTool] = useState('booth');
  const [selectedBoothId, setSelectedBoothId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [propertiesForm, setPropertiesForm] = useState(DEFAULT_PROPERTIES_FORM);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(createDefaultCreateForm());
  const [boothKeyword, setBoothKeyword] = useState('');
  const [showGridView, setShowGridView] = useState(true);
  const [draggingItemId, setDraggingItemId] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorViewMode, setEditorViewMode] = useState('2d');
  const [editorZoom, setEditorZoom] = useState(1);
  const [editorPan, setEditorPan] = useState({ x: 0, y: 0 });
  const dragOriginRef = useRef(null);
  const panOriginRef = useRef(null);
  const isoSvgRef = useRef(null);
  const isoDragRef = useRef(null);
  const suppressCanvasClickRef = useRef(false);

  // API hooks
  const { data: layouts = [], loading: layoutsLoading, error: layoutsError, reload: reloadLayouts } = useApi(
    marketId ? `/markets/${marketId}/layouts` : null,
    { initialData: [] }
  );
  const { data: boothTypes = [] } = useApi(
    marketId ? `/markets/${marketId}/booth-types?status=active` : null,
    { initialData: [] },
  );
  const { data: booths = [], loading: boothsLoading, error: boothsError, reload: reloadBooths } = useApi(
    marketId ? `/markets/${marketId}/booths` : null,
    { initialData: [] }
  );
  const {
    data: selectedLayoutData,
    loading: selectedLayoutLoading,
    error: selectedLayoutError,
    reload: reloadSelectedLayout,
    setData: setSelectedLayoutData,
  } = useApi(
    marketId && selectedLayoutId && viewMode === 'editor' ? `/markets/${marketId}/layouts/${selectedLayoutId}` : null,
    { initialData: null, skip: !marketId || !selectedLayoutId || viewMode !== 'editor' },
  );
  const { mutate, loading: saving, error: saveError } = useMutation();
  const layoutRows = normalizeRows(layouts);
  const floorPlanRows = normalizeRows(boothTypes);
  const boothRows = normalizeRows(booths).filter((row) => row.status !== 'deleted');
  const selectedLayout = selectedLayoutData;

  // Initialize editor when layout is loaded
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

  // Update properties form when item is selected
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
      rowSpan: String(selectedItem.rowSpan || 1),
      colSpan: String(selectedItem.colSpan || 1),
    });
  }, [selectedItem]);

  // Filter unplaced booths
  const placedBoothIds = useMemo(
    () => new Set((layoutDraft?.items || []).filter((item) => item.type === 'booth').map((item) => Number(item.boothId))),
    [layoutDraft],
  );

  const filteredBoothRows = useMemo(() => {
    if (!selectedLayout?.floorPlanId) return boothRows;
    return boothRows.filter((booth) => Number(booth.floor_plan_id || booth.floorPlanId || 0) === Number(selectedLayout.floorPlanId));
  }, [boothRows, selectedLayout?.floorPlanId]);

  const unplacedBooths = useMemo(() => {
    const keyword = boothKeyword.trim().toLowerCase();
    return filteredBoothRows
      .filter((booth) => !placedBoothIds.has(Number(booth.id)))
      .filter((booth) => {
        if (!keyword) return true;
        return `${booth.code || ''} ${booth.name || ''} ${booth.category_name || ''}`.toLowerCase().includes(keyword);
      });
  }, [boothKeyword, filteredBoothRows, placedBoothIds]);

  useEffect(() => {
    if (!selectedBoothId) return;
    const stillSelectable = unplacedBooths.some((booth) => String(booth.id) === String(selectedBoothId));
    if (!stillSelectable) {
      setSelectedBoothId('');
    }
  }, [selectedBoothId, unplacedBooths]);

  const canvasCellSize = useMemo(() => {
    const raw = Number(layoutDraft?.cellSize || layoutForm.cellSize || 48);
    return Math.max(28, Math.min(raw, 42));
  }, [layoutDraft, layoutForm.cellSize]);

  const canvasWidth = (layoutDraft?.columns || 0) * canvasCellSize;
  const canvasHeight = (layoutDraft?.rows || 0) * canvasCellSize;
  const scaledCanvasWidth = Math.max(canvasWidth * editorZoom, 1);
  const scaledCanvasHeight = Math.max(canvasHeight * editorZoom, 1);
  const is3DMode = editorViewMode === '3d';
  const isPublishedRender = is3DMode && selectedLayout?.status === 'published';
  const interactiveMapScale = useMemo(() => {
    const maxDimension = Math.max(canvasWidth, canvasHeight, 1);
    return Math.max(0.52, Math.min(1, 760 / maxDimension));
  }, [canvasHeight, canvasWidth]);
  const isoMapModel = useMemo(
    () => createIsoMapModel(layoutDraft, canvasCellSize, isPublishedRender),
    [canvasCellSize, isPublishedRender, layoutDraft],
  );
  const isoItems = useMemo(() => {
    const items = [...(layoutDraft?.items || [])];
    return items.sort((first, second) => {
      if (first.id === selectedItemId) return 1;
      if (second.id === selectedItemId) return -1;
      const firstDepth = Number(first.row || 1) + Number(first.col || 1) + Number(first.rowSpan || 1) + Number(first.colSpan || 1);
      const secondDepth = Number(second.row || 1) + Number(second.col || 1) + Number(second.rowSpan || 1) + Number(second.colSpan || 1);
      return firstDepth - secondDepth;
    });
  }, [layoutDraft?.items, selectedItemId]);

  const previewLayout = useMemo(() => {
    if (!layoutDraft) return null;
    return normalizeLayoutForSave(layoutDraft, layoutForm.rowsCount, layoutForm.columnsCount, layoutForm.cellSize);
  }, [layoutDraft, layoutForm.rowsCount, layoutForm.columnsCount, layoutForm.cellSize]);

  if (!marketId) return <NeedMarket />;

  // ============================================================================
  // HANDLERS - CREATE & SAVE
  // ============================================================================
  async function createLayout(event) {
    event.preventDefault();
    const payload = await mutate(`/markets/${marketId}/layouts`, {
      name: createForm.name,
      description: createForm.description,
      floorPlanId: Number(createForm.floorPlanId) || null,
      rowsCount: Number(createForm.rowsCount),
      columnsCount: Number(createForm.columnsCount),
      cellSize: Number(createForm.cellSize),
    });
    setCreateModalOpen(false);
    setCreateForm(createDefaultCreateForm());
    await reloadLayouts();
    if (payload?.id) {
      setSelectedLayoutId(String(payload.id));
      setViewMode('editor');
    }
  }

  function updateEditorZoom(nextZoom) {
    setEditorZoom(Math.max(0.5, Math.min(2, Number(nextZoom))));
  }

  function changeEditorViewMode(nextMode) {
    setEditorViewMode(nextMode);
    setEditorPan({ x: 0, y: 0 });
  }

  function startPlanPan(event) {
    if (!is3DMode || event.button !== 0 || event.target.closest('[data-plan-item="true"]')) return;
    panOriginRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: editorPan.x,
      originY: editorPan.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function movePlanPan(event) {
    const panOrigin = panOriginRef.current;
    if (!is3DMode || !panOrigin || panOrigin.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - panOrigin.startX;
    const deltaY = event.clientY - panOrigin.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      panOrigin.moved = true;
      suppressCanvasClickRef.current = true;
    }
    setEditorPan({
      x: panOrigin.originX + deltaX,
      y: panOrigin.originY + deltaY,
    });
  }

  function stopPlanPan(event) {
    const panOrigin = panOriginRef.current;
    if (!panOrigin || panOrigin.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    panOriginRef.current = null;
    if (panOrigin.moved) {
      window.setTimeout(() => {
        suppressCanvasClickRef.current = false;
      }, 0);
    }
  }

  function handlePlanWheel(event) {
    if (!is3DMode) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.08 : 0.08;
    updateEditorZoom(editorZoom + direction);
  }

  function buildLayoutSavePayload() {
    if (!selectedLayoutId || !layoutDraft) return;
    const normalizedLayout = normalizeLayoutForSave(
      layoutDraft,
      layoutForm.rowsCount,
      layoutForm.columnsCount,
      layoutForm.cellSize,
    );
    return {
      normalizedLayout,
      payload: {
      name: layoutForm.name,
      description: layoutForm.description,
      rowsCount: normalizedLayout.rows,
      columnsCount: normalizedLayout.columns,
      cellSize: normalizedLayout.cellSize,
      layoutJson: {
        version: 1,
        rows: normalizedLayout.rows,
        columns: normalizedLayout.columns,
        cellSize: normalizedLayout.cellSize,
        items: normalizedLayout.items,
      },
      },
    };
  }

  function buildObjectOnlyPayload() {
    if (!layoutDraft) return null;
    return {
      layoutJson: {
        ...(selectedLayout?.layoutJson || {}),
        version: 1,
        rows: Number(selectedLayout?.rowsCount || layoutDraft.rows),
        columns: Number(selectedLayout?.columnsCount || layoutDraft.columns),
        cellSize: Number(selectedLayout?.cellSize || layoutDraft.cellSize),
        items: (layoutDraft.items || []).map((item) => ({
          ...item,
          row: Number(item.row || 1),
          col: Number(item.col || 1),
          rowSpan: Number(item.rowSpan || 1),
          colSpan: Number(item.colSpan || 1),
        })),
      },
    };
  }

  function applySavedLayout(normalizedLayout, savedLayout = {}) {
    setLayoutForm((current) => ({
      ...current,
      rowsCount: String(normalizedLayout.rows),
      columnsCount: String(normalizedLayout.columns),
      cellSize: String(normalizedLayout.cellSize),
    }));
    setLayoutDraft({
      version: 1,
      rows: normalizedLayout.rows,
      columns: normalizedLayout.columns,
      cellSize: normalizedLayout.cellSize,
      items: normalizedLayout.items,
    });
    setSelectedLayoutData((current) => ({
      ...(current || selectedLayout || {}),
      ...savedLayout,
      name: savedLayout.name ?? layoutForm.name,
      description: savedLayout.description ?? layoutForm.description,
      rowsCount: savedLayout.rowsCount ?? normalizedLayout.rows,
      columnsCount: savedLayout.columnsCount ?? normalizedLayout.columns,
      cellSize: savedLayout.cellSize ?? normalizedLayout.cellSize,
      layoutJson: savedLayout.layoutJson ?? {
        version: 1,
        rows: normalizedLayout.rows,
        columns: normalizedLayout.columns,
        cellSize: normalizedLayout.cellSize,
        items: normalizedLayout.items,
      },
    }));
    setViewMode('editor');
  }

  async function saveLayout() {
    const saveData = buildLayoutSavePayload();
    if (!saveData) return;
    const savedLayout = await mutate(`/markets/${marketId}/layouts/${selectedLayoutId}`, saveData.payload, 'PATCH');
    applySavedLayout(saveData.normalizedLayout, savedLayout);
    await reloadLayouts();
    await reloadSelectedLayout();
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
    const objectPayload = buildObjectOnlyPayload();
    if (objectPayload) await mutate(`/markets/${marketId}/layouts/${selectedLayoutId}`, objectPayload, 'PATCH');
    await mutate(`/markets/${marketId}/layouts/${selectedLayoutId}/publish`, {}, 'POST');
    await reloadLayouts();
    await reloadSelectedLayout();
    setSelectedLayoutData((current) => ({
      ...(current || selectedLayout || {}),
      ...(objectPayload || {}),
      status: 'published',
    }));
    setEditorViewMode('3d');
    setShowGridView(false);
    setEditorPan({ x: 0, y: 0 });
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
    setViewMode('list');
    await reloadLayouts();
  }

  // ============================================================================
  // HANDLERS - PLACE & UPDATE ITEMS
  // ============================================================================
  function placeItemAtCell(row, col) {
    if (!layoutDraft) return;
    
    // Check if there's already an item at this cell
    const existingItem = getItemAtCell(layoutDraft.items, row, col);
    if (existingItem) {
      setSelectedItemId(existingItem.id);
      return;
    }

    // Handle booth placement
    if (selectedTool === 'booth') {
      const booth = filteredBoothRows.find((item) => String(item.id) === String(selectedBoothId));
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

    // Handle eraser tool
    if (selectedTool === 'eraser') {
      return; // Eraser logic handled by clicking on existing items
    }

    // Handle other objects
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
      row: Number(selectedItem.row || 1),
      col: Number(selectedItem.col || 1),
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

  function handleEraserClick(row, col) {
    if (selectedTool !== 'eraser') return;
    const itemToRemove = getItemAtCell(layoutDraft.items, row, col);
    if (itemToRemove) {
      setLayoutDraft((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== itemToRemove.id),
      }));
      if (selectedItemId === itemToRemove.id) {
        setSelectedItemId('');
      }
    }
  }

  function handleCanvasClick(row, col) {
    if (selectedTool === 'eraser') {
      handleEraserClick(row, col);
    } else {
      placeItemAtCell(row, col);
    }
  }

  function moveItemToCell(itemId, row, col) {
    if (!layoutDraft) return;
    const targetItem = layoutDraft.items.find((item) => item.id === itemId);
    if (!targetItem) return;
    const candidate = {
      ...targetItem,
      row,
      col,
    };
    const errorMessage = validatePlacement(
      layoutDraft.items,
      candidate,
      layoutDraft.rows,
      layoutDraft.columns,
      targetItem.id,
    );
    if (errorMessage) {
      showAlert({ title: 'ย้ายวัตถุไม่ได้', text: errorMessage, icon: 'warning' });
      return;
    }
    setLayoutDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === itemId ? candidate : item)),
    }));
    setSelectedItemId(itemId);
  }

  function getIsoCellFromPointer(event) {
    const svg = isoSvgRef.current;
    if (!svg || !isoMapModel) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const svgPoint = point.matrixTransform(matrix.inverse());
    const rowFloat = (svgPoint.y / isoMapModel.tileHeight) - (svgPoint.x / isoMapModel.tileWidth);
    const colFloat = (svgPoint.y / isoMapModel.tileHeight) + (svgPoint.x / isoMapModel.tileWidth);
    const row = Math.max(1, Math.min(layoutDraft.rows, Math.floor(rowFloat) + 1));
    const col = Math.max(1, Math.min(layoutDraft.columns, Math.floor(colFloat) + 1));
    return { row, col };
  }

  function handleIsoItemPointerDown(event, item) {
    if (!is3DMode || event.button !== 0) return;
    event.stopPropagation();
    setSelectedItemId(item.id);
    setDraggingItemId(item.id);
    isoDragRef.current = {
      itemId: item.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleIsoItemPointerMove(event) {
    const dragState = isoDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragState.moved = true;
    }
  }

  function handleIsoItemPointerUp(event) {
    const dragState = isoDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    isoDragRef.current = null;
    setDraggingItemId('');
    if (!dragState.moved) {
      setSelectedItemId(dragState.itemId);
      return;
    }
    const cell = getIsoCellFromPointer(event);
    if (cell) moveItemToCell(dragState.itemId, cell.row, cell.col);
  }

  function handleItemDragStart(event, item) {
    setDraggingItemId(item.id);
    dragOriginRef.current = { row: item.row, col: item.col };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id);
  }

  function handleGridDrop(event, row, col) {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('text/plain') || draggingItemId;
    if (!itemId) return;
    moveItemToCell(itemId, row, col);
    setDraggingItemId('');
    dragOriginRef.current = null;
  }

  function handleDragEnd() {
    setDraggingItemId('');
    dragOriginRef.current = null;
  }

  function renderIsoMap() {
    if (!layoutDraft) return null;
    const model = isoMapModel;
    const gridLines = [];
    for (let row = model.minRow; row <= model.maxRow; row += 1) {
      gridLines.push({ id: `r-${row}`, points: [model.project(row, model.minCol), model.project(row, model.maxCol)] });
    }
    for (let col = model.minCol; col <= model.maxCol; col += 1) {
      gridLines.push({ id: `c-${col}`, points: [model.project(model.minRow, col), model.project(model.maxRow, col)] });
    }
    const cellHits = [];
    for (let row = model.minRow; row < model.maxRow; row += 1) {
      for (let col = model.minCol; col < model.maxCol; col += 1) {
        cellHits.push({
          row: row + 1,
          col: col + 1,
          points: [
            model.project(row, col),
            model.project(row, col + 1),
            model.project(row + 1, col + 1),
            model.project(row + 1, col),
          ],
        });
      }
    }

    return (
      <svg
        ref={isoSvgRef}
        className="h-full w-full select-none"
        viewBox={model.viewBox}
        role="img"
        aria-label="Isometric interactive market map"
        style={{
          transform: `translate(${editorPan.x}px, ${editorPan.y}px) scale(${editorZoom * interactiveMapScale})`,
          transformOrigin: 'center center',
          overflow: 'visible',
        }}
      >
        <defs>
          <filter id="visual-plan-iso-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#64748b" floodOpacity="0.16" />
          </filter>
          <linearGradient id="visual-plan-floor" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
        </defs>

        <polygon
          points={pointString(model.floorPoints)}
          fill="url(#visual-plan-floor)"
          stroke="#dbeafe"
          strokeWidth="1.5"
          filter="url(#visual-plan-iso-shadow)"
        />

        {showGridView && !isPublishedRender ? gridLines.map((line) => (
          <line
            key={line.id}
            x1={line.points[0].x}
            y1={line.points[0].y}
            x2={line.points[1].x}
            y2={line.points[1].y}
            stroke="#dbeafe"
            strokeWidth="1"
          />
        )) : null}

        {cellHits.map((cell) => (
          <polygon
            key={`${cell.row}-${cell.col}`}
            points={pointString(cell.points)}
            fill="transparent"
            stroke="transparent"
            className="cursor-crosshair transition hover:fill-cyan-100/30"
            role="button"
            tabIndex={0}
            aria-label={`วาง object ที่ row ${cell.row} col ${cell.col}`}
            onClick={() => {
              if (suppressCanvasClickRef.current) {
                suppressCanvasClickRef.current = false;
                return;
              }
              handleCanvasClick(cell.row, cell.col);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleCanvasClick(cell.row, cell.col);
              }
            }}
          />
        ))}

        {isoItems.map((item) => {
          const row = Number(item.row || 1) - 1;
          const col = Number(item.col || 1) - 1;
          const rowSpan = Number(item.rowSpan || 1);
          const colSpan = Number(item.colSpan || 1);
          const depth = getIsoItemHeight(item.type);
          const colors = getIsoItemColors(item.type);
          const topPoints = [
            model.project(row, col),
            model.project(row, col + colSpan),
            model.project(row + rowSpan, col + colSpan),
            model.project(row + rowSpan, col),
          ];
          const lowered = topPoints.map((point) => ({ x: point.x, y: point.y + depth }));
          const sidePoints = [topPoints[1], topPoints[2], lowered[2], lowered[1]];
          const frontPoints = [topPoints[2], topPoints[3], lowered[3], lowered[2]];
          const center = {
            x: (topPoints[0].x + topPoints[2].x) / 2,
            y: (topPoints[0].y + topPoints[2].y) / 2,
          };
          const selected = selectedItemId === item.id;
          const fontSize = Math.max(9, Math.min(12, canvasCellSize * 0.28));
          const def = getObjectDefinition(item.type);
          const IconComponent = def.icon;
          const iconSize = Math.max(16, Math.min(22, canvasCellSize * 0.5));

          return (
            <g
              key={item.id}
              data-plan-item="true"
              role="button"
              tabIndex={0}
              className={classNames(
                'cursor-grab outline-none transition-opacity active:cursor-grabbing',
                draggingItemId === item.id ? 'opacity-70' : '',
              )}
              onPointerDown={(event) => handleIsoItemPointerDown(event, item)}
              onPointerMove={handleIsoItemPointerMove}
              onPointerUp={handleIsoItemPointerUp}
              onPointerCancel={handleIsoItemPointerUp}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedItemId(item.id);
                }
              }}
            >
              <polygon points={pointString(frontPoints)} fill={colors.front} stroke={colors.side} strokeWidth="0.8" />
              <polygon points={pointString(sidePoints)} fill={colors.side} stroke={colors.side} strokeWidth="0.8" />
              <polygon
                points={pointString(topPoints)}
                fill={colors.top}
                stroke={selected ? '#f59e0b' : colors.stroke}
                strokeWidth={selected ? '2.8' : '1.6'}
              />
              {item.type === 'booth' ? (
                <text
                  x={center.x}
                  y={center.y + 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={colors.text}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  paintOrder="stroke"
                  fontSize={fontSize}
                  fontWeight="800"
                  className="pointer-events-none"
                >
                  {getIsoItemLabel(item)}
                </text>
              ) : (
                <foreignObject
                  x={center.x - (iconSize / 2)}
                  y={center.y - (iconSize / 2)}
                  width={iconSize}
                  height={iconSize}
                  className="pointer-events-none overflow-visible"
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex h-full w-full items-center justify-center"
                    style={{ color: colors.text }}
                  >
                    <IconComponent className="h-full w-full drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]" />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ============================================================================
  // RENDER - LIST VIEW
  // ============================================================================
  if (viewMode === 'list') {
    const loading = layoutsLoading;
    const pageError = layoutsError;

    return (
      <>
        <PageHeader
          title="แผนผังตลาด / Visual Plan"
          description="จัดการรายการแผนผังตลาด เลือกหรือสร้างแผนผังใหม่เพื่อจัดวางบูธและวัตถุต่างๆ"
          action={(
            <button
              type="button"
              onClick={() => {
                setCreateForm(createDefaultCreateForm());
                setCreateModalOpen(true);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700"
            >
              <Plus size={18} />
              สร้าง Visual Plan
            </button>
          )}
        />

        <Card>
          <ErrorNotice error={pageError} hint="ตรวจสอบ migration market_layouts และ endpoint /markets/:marketId/layouts" />
          {loading && <LoadingBlock />}
          {!loading && !layoutRows.length ? (
            <EmptyState 
              title="ยังไม่มี Visual Plan" 
              description="เริ่มจากสร้าง Visual Plan ใหม่สำหรับตลาดนี้ก่อน"
              action={(
                <button
                  type="button"
                  onClick={() => {
                    setCreateForm(createDefaultCreateForm());
                    setCreateModalOpen(true);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white transition hover:bg-cyan-700"
                >
                  <Plus size={18} />
                  สร้าง Visual Plan แรก
                </button>
              )}
            />
          ) : null}

          {layoutRows.length ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-600">
                  พบ {layoutRows.length} แผนผังตลาด
                </p>
              </div>
              <VisualPlanListTable 
                layouts={layoutRows} 
                onEdit={(id) => {
                  setSelectedLayoutId(String(id));
                  setViewMode('editor');
                }} 
              />
            </div>
          ) : null}
        </Card>

        <Modal open={createModalOpen} title="สร้าง Visual Plan ใหม่" onClose={() => setCreateModalOpen(false)}>
          <FormPanel onSubmit={createLayout} loading={saving} error={saveError}>
            <div className="space-y-4">
              <TextInput 
                label="ชื่อ Visual Plan" 
                placeholder="เช่น Visual Plan - ตลาดไนท์สแควร์"
                value={createForm.name} 
                onChange={(value) => setCreateForm((current) => ({ ...current, name: value }))} 
                required 
              />
              <TextInput 
                label="คำอธิบาย" 
                placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับแผนผังนี้"
                value={createForm.description} 
                onChange={(value) => setCreateForm((current) => ({ ...current, description: value }))} 
              />
              <SelectInput
                label="อ้างอิงแผนผังบูธ"
                value={createForm.floorPlanId}
                onChange={(value) => setCreateForm((current) => ({ ...current, floorPlanId: value }))}
                options={floorPlanRows.map((item) => [String(item.id), item.name || `Floor plan ${item.id}`])}
                placeholder="เลือกแผนผังบูธ"
              />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-extrabold text-slate-900">ขนาดของ Grid</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextInput 
                    label="จำนวนแถว (Rows)" 
                    type="number" 
                    value={createForm.rowsCount} 
                    onChange={(value) => setCreateForm((current) => ({ ...current, rowsCount: value }))} 
                    required 
                  />
                  <TextInput 
                    label="จำนวนคอลัมน์ (Columns)" 
                    type="number" 
                    value={createForm.columnsCount} 
                    onChange={(value) => setCreateForm((current) => ({ ...current, columnsCount: value }))} 
                    required 
                  />
                  <TextInput 
                    label="ขนาดเซลล์ (px)" 
                    type="number" 
                    value={createForm.cellSize} 
                    onChange={(value) => setCreateForm((current) => ({ ...current, cellSize: value }))} 
                    required 
                  />
                </div>
              </div>
            </div>
          </FormPanel>
        </Modal>
      </>
    );
  }

  // ============================================================================
  // RENDER - EDITOR VIEW
  // ============================================================================
  const loading = boothsLoading || selectedLayoutLoading;
  const pageError = boothsError || selectedLayoutError || saveError;

  return (
    <>
      {/* Editor Topbar */}
      <EditorTopbar
        layout={selectedLayout || { name: 'New Layout', rowsCount: layoutForm.rowsCount, columnsCount: layoutForm.columnsCount }}
        status={selectedLayout?.status || 'draft'}
        onSave={saveLayout}
        onPublish={publishLayout}
        onViewPreview={() => setPreviewOpen(true)}
        viewMode={editorViewMode}
        onViewModeChange={changeEditorViewMode}
        zoom={editorZoom}
        onZoomChange={updateEditorZoom}
        showGrid={showGridView}
        onToggleGrid={() => setShowGridView((current) => !current)}
      />

      <div className="mt-6 space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Object Palette</p>
              <p className="mt-1 text-sm font-bold text-slate-500">เลือกวัตถุเพื่อวางบนแผนผัง จากนั้นคลิกหรือลากในพื้นที่ Grid</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setSelectedLayoutId('');
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              ← กลับสู่รายการ Visual Plan
            </button>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {VISUAL_PLAN_OBJECTS.map((item) => (
              <ObjectPaletteButton
                key={item.type}
                item={item}
                active={selectedTool === item.type}
                onClick={() => setSelectedTool(item.type)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px]">

        {/* Center - Canvas */}
        <section className="min-w-0 space-y-4">
          <ErrorNotice error={pageError} />
          {loading && <LoadingBlock />}
          
          {!layoutDraft ? (
            <EmptyState title="กำลังโหลดแผนผัง" description="กรุณารอสักครู่" />
          ) : (
            <div
              className={classNames(
                'relative rounded-3xl border border-slate-200',
                is3DMode
                  ? 'h-[620px] cursor-grab overflow-hidden bg-slate-950 active:cursor-grabbing'
                  : 'overflow-auto bg-slate-100 p-4',
              )}
              onPointerDown={startPlanPan}
              onPointerMove={movePlanPan}
              onPointerUp={stopPlanPan}
              onPointerCancel={stopPlanPan}
              onWheel={handlePlanWheel}
              style={{
                background: is3DMode
                  ? 'linear-gradient(135deg, #f8fafc 0%, #eef6ff 45%, #f8fafc 100%)'
                  : undefined,
                touchAction: is3DMode ? 'none' : undefined,
              }}
            >
              {is3DMode ? (
                <>
                  <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-200/70 backdrop-blur">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-700">Indoor Map</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-950">{selectedLayout?.floorPlanName || selectedLayout?.name || 'Visual Plan'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {isPublishedRender ? 'Published render' : `${layoutDraft.items.length} objects`} · {Math.round(editorZoom * 100)}%
                    </p>
                  </div>
                  <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2 text-xs font-bold text-slate-600 shadow-lg shadow-slate-200/70 backdrop-blur">
                    ลากพื้นที่ว่างเพื่อเลื่อนแผนผัง · ใช้ล้อเมาส์เพื่อซูม
                  </div>
                </>
              ) : null}
              <div
                className={classNames(
                  'relative',
                  is3DMode ? 'h-full w-full' : '',
                )}
                style={{
                  width: is3DMode ? '100%' : `${scaledCanvasWidth}px`,
                  height: is3DMode ? '100%' : `${scaledCanvasHeight}px`,
                  perspective: is3DMode ? '1400px' : undefined,
                }}
              >
                {is3DMode ? (
                  <div className="absolute inset-0">
                    {renderIsoMap()}
                  </div>
                ) : (
                  <div
                    className="relative bg-white shadow-inner"
                    style={{
                      width: `${canvasWidth}px`,
                      height: `${canvasHeight}px`,
                      transform: `scale(${editorZoom})`,
                      transformOrigin: 'top left',
                    }}
                  >

                  {/* Grid Background */}
                  {showGridView && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #e2e8f0 1px, transparent 1px),
                        linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
                      `,
                      backgroundSize: `${canvasCellSize}px ${canvasCellSize}px`,
                    }}
                  />
                  )}

                  {/* Grid Cells (for interaction) */}
                  <div
                    className="relative grid"
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
                          onClick={() => {
                            if (suppressCanvasClickRef.current) {
                              suppressCanvasClickRef.current = false;
                              return;
                            }
                            handleCanvasClick(row, col);
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleGridDrop(event, row, col)}
                          className={classNames(
                            'h-full min-h-[28px] border border-transparent transition',
                            'hover:bg-cyan-50/50',
                          )}
                          aria-label={`วาง object ที่ row ${row} col ${col}`}
                        />
                      );
                    })}
                  </div>

                  {/* Placed Items */}
                  {layoutDraft.items.map((item) => {
                    const def = getObjectDefinition(item.type);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-plan-item="true"
                        draggable
                        onPointerDown={(event) => event.stopPropagation()}
                        onDragStart={(event) => handleItemDragStart(event, item)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemId(item.id);
                        }}
                        className={classNames(
                          'absolute rounded-xl border-2 px-1 py-1 text-center shadow-md transition-all',
                          'overflow-hidden',
                          selectedItemId === item.id ? 'ring-2 ring-amber-400 ring-offset-2 z-10' : 'hover:shadow-lg',
                          draggingItemId === item.id ? 'opacity-70' : '',
                          def.borderColor,
                          def.bgColor,
                          def.textColor,
                        )}
                        style={buildItemStyle(item, canvasCellSize)}
                      >
                        <div className="relative flex h-full w-full flex-col items-center justify-center">
                          {item.type === 'booth' ? (
                            <span className="truncate text-[10px] font-extrabold leading-none">
                              {item.boothCode || item.label}
                            </span>
                          ) : def.icon ? (
                            <def.icon className={classNames('h-4 w-4', def.iconColor)} />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Panel - Properties & Booth Selection */}
        <aside className="space-y-4">
          {/* Booth Selection Panel */}
          {selectedTool === 'booth' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">เลือกบูธ</p>
              <p className="mt-1 text-sm font-bold text-slate-500">
                {unplacedBooths.length} บูธที่ยังไม่ได้วาง
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                แผนผังบูธ: {selectedLayout?.floorPlanName || 'ไม่ระบุ'}
              </p>
              <div className="mt-3">
                <SearchInput 
                  value={boothKeyword} 
                  onChange={setBoothKeyword} 
                  placeholder="ค้นหารหัสหรือชื่อบูธ" 
                />
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                เลือกแล้ว {selectedBoothId ? 1 : 0} / {unplacedBooths.length} บูธ
              </div>
              <div className="mt-3 max-h-[360px] overflow-y-auto pr-1">
                {unplacedBooths.length ? (
                  <div className="grid grid-cols-5 gap-1">
                    {unplacedBooths.map((booth) => (
                      <button
                        key={booth.id}
                        type="button"
                        onClick={() => setSelectedBoothId(String(booth.id))}
                        className={classNames(
                          'relative min-h-11 rounded-lg border-2 border-dashed p-1 text-center shadow-sm transition',
                          String(selectedBoothId) === String(booth.id)
                            ? 'border-amber-300 bg-amber-500 text-white'
                            : 'border-cyan-200 bg-cyan-600 text-white hover:bg-cyan-700'
                        )}
                      >
                        <div className="flex h-full w-full flex-col items-center justify-center">
                          <span className="max-w-full truncate text-[11px] font-extrabold leading-none">
                            {booth.code || booth.name || booth.id}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="บูธถูกวางครบแล้ว" 
                    description="ไม่มีบูธที่ยังวางไม่เสร็จใน layout นี้" 
                  />
                )}
              </div>
            </div>
          )}

          {/* Properties Panel */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Properties</p>
                <p className="mt-1 text-sm font-bold text-slate-500">แก้ไขขนาดแบบ 1x1, 1x2, 2x2</p>
              </div>
              {selectedItem ? (
                <button
                  type="button"
                  onClick={removeSelectedItem}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>
            
            {!selectedItem ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
                คลิกวัตถุบนแผนผังเพื่อดูรายละเอียด
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Booth Info Display */}
                {selectedItem.type === 'booth' && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm font-extrabold text-emerald-900">{selectedItem.boothCode || selectedItem.label}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-700">บูธที่เชื่อมกับข้อมูลจริง</p>
                  </div>
                )}

                {/* Editable Fields */}
                {selectedItem.type !== 'booth' && (
                  <TextInput
                    label="ชื่อ / Label"
                    value={propertiesForm.label}
                    onChange={(value) => setPropertiesForm((current) => ({ ...current, label: value }))}
                  />
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput 
                    label="ความสูง (Row Span)" 
                    type="number" 
                    value={propertiesForm.rowSpan} 
                    onChange={(value) => setPropertiesForm((current) => ({ ...current, rowSpan: value }))} 
                  />
                  <TextInput 
                    label="ความกว้าง (Col Span)" 
                    type="number" 
                    value={propertiesForm.colSpan} 
                    onChange={(value) => setPropertiesForm((current) => ({ ...current, colSpan: value }))} 
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                  Dimension: {propertiesForm.colSpan || '1'} x {propertiesForm.rowSpan || '1'}
                </div>

                <SmallButton tone="cyan" onClick={updateSelectedItem} fullWidth>
                  อัปเดตขนาด
                </SmallButton>
              </div>
            )}
          </div>
        </aside>
      </div>

      <Modal open={previewOpen} title="ดูตัวอย่างแผนผัง" onClose={() => setPreviewOpen(false)} size="xl">
        {!previewLayout ? (
          <EmptyState title="ยังไม่มีข้อมูล" description="ยังไม่มีวัตถุในแผนผังนี้" />
        ) : (
          <div className="overflow-auto rounded-3xl border border-slate-200 bg-slate-100 p-4">
            <div
              className="relative mx-auto bg-white shadow-inner"
              style={{
                width: `${previewLayout.columns * canvasCellSize}px`,
                height: `${previewLayout.rows * canvasCellSize}px`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e2e8f0 1px, transparent 1px),
                    linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
                  `,
                  backgroundSize: `${canvasCellSize}px ${canvasCellSize}px`,
                }}
              />
              {previewLayout.items.map((item) => {
                const def = getObjectDefinition(item.type);
                return (
                  <div
                    key={item.id}
                    className={classNames(
                      'absolute overflow-hidden rounded-xl border-2 px-1 py-1 text-center shadow-md',
                      def.borderColor,
                      def.bgColor,
                      def.textColor,
                    )}
                    style={buildItemStyle(item, canvasCellSize)}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center">
                      {item.type === 'booth' ? (
                        <span className="truncate text-[10px] font-extrabold leading-none">
                          {item.boothCode || item.label}
                        </span>
                      ) : def.icon ? (
                        <def.icon className={classNames('h-4 w-4', def.iconColor)} />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
      </div>
    </>
  );
}
