import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Heading1,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Printer,
  Redo2,
  Search,
  Type,
  Underline,
  Undo2,
  X,
} from 'lucide-react';
import { EmptyState } from './EmptyState.jsx';
import { LoadingBlock } from './LoadingBlock.jsx';
import { useSubscription } from '../state/subscription.jsx';
import { classNames, escapeHtml, reportFileName } from '../utils/formatters.js';

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

async function exportReportExcel(title, columns, rows) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Jonglock';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('report');
  worksheet.addRow([title]);
  worksheet.mergeCells(1, 1, 1, Math.max(columns.length, 1));
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.addRow(columns);
  worksheet.getRow(2).font = { bold: true };
  worksheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  rows.forEach((row) => worksheet.addRow(row));
  worksheet.columns.forEach((column, index) => {
    const header = String(columns[index] || '');
    let maxLength = header.length;
    column.eachCell({ includeEmpty: true }, (cell) => {
      maxLength = Math.max(maxLength, String(cell.value || '').length);
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 44);
  });
  worksheet.views = [{ state: 'frozen', ySplit: 2 }];
  const output = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), reportFileName(title, 'xlsx'));
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

export function ErrorNotice({ error, hint }) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-semibold">โหลดข้อมูลจาก API ไม่สำเร็จ</p>
      <p className="mt-1">{error}</p>
      {hint ? <p className="mt-1 text-amber-700">{hint}</p> : null}
    </div>
  );
}

export function NeedMarket() {
  return <EmptyState title="กรุณาเลือกตลาด" description="เลือกตลาดจากด้านบนก่อนจัดการข้อมูลส่วนนี้" />;
}

export function FilterPill({ children, active, onClick }) {
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

export function BoothBox({ label, subLabel, danger = false, tone = '', onClick, disabled = false }) {
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

export function Toolbar({ keyword, onKeyword }) {
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

export function SearchInput({ value, onChange, placeholder = 'ค้นหา' }) {
  return (
    <label className="relative block w-full sm:w-[280px]">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  );
}

export function PasswordPolicyHint({ optional = false }) {
  const items = [
    'อย่างน้อย 10 ตัวอักษร',
    'มีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว',
    'มีตัวเลขอย่างน้อย 1 ตัว',
    'มีอักขระพิเศษอย่างน้อย 1 ตัว',
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
      <div className="font-semibold text-slate-700">{optional ? 'นโยบายรหัสผ่านใหม่' : 'นโยบายรหัสผ่าน'}</div>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

export function filterRowsByKeyword(rows = [], keyword = '') {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => Object.values(row || {}).some((value) => String(value ?? '').toLowerCase().includes(needle)));
}

export function ReportFiltersBar({ children }) {
  return <div className="flex w-full flex-col items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft sm:p-4 xl:w-auto xl:min-w-[720px]">{children}</div>;
}

export function ReportActionButton({ children, tone = 'slate', onClick, disabled = false }) {
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

export function ReportExportActions({ title, columns, rows, disabled = false }) {
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

export function Modal({ open, title, children, onClose }) {
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

export function FormPanel({ title, children, onSubmit, loading, error }) {
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

export function Label({ children }) {
  return <span className="text-sm font-bold text-slate-600">{children}</span>;
}

export function TextInput({ label, value, onChange, type = 'text', required = false, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <TextInputBare value={value} onChange={onChange} type={type} required={required} autoComplete={autoComplete} />
    </label>
  );
}

export function TextInputBare({ value, onChange, type = 'text', required = false, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="relative">
      <input type={isPassword && visible ? 'text' : type} value={value} required={required} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} className={classNames('h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100', isPassword ? 'pr-11' : '')} />
      {isPassword ? (
        <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      ) : null}
    </div>
  );
}

export function DatePicker({ label, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <DatePickerBare value={value} onChange={onChange} required={required} />
    </label>
  );
}

export function DatePickerBare({ value, onChange, required = false, className = '' }) {
  return <input type="date" value={value} required={required} onChange={(event) => onChange(event.target.value)} className={classNames('h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100', className)} />;
}

export function TimePicker({ label, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <input type="time" value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
    </label>
  );
}

export function RichTextEditor({ label, value, onChange, onUploadImage, uploadingImage = false }) {
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

export function DateTimePicker({ label, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <input type="datetime-local" value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
    </label>
  );
}

export function FileInput({ label, onChange, multiple = false }) {
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

export function FileSummary({ file }) {
  if (!file) return null;
  return <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">เลือกแล้ว {file.name}</div>;
}

export function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

export function SmallButton({ children, tone = 'slate', onClick, disabled = false }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-100',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100',
  };
  return <button type="button" disabled={disabled} onClick={onClick} className={classNames('inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50', tones[tone])}>{children}</button>;
}

export function OutlineButton({ children, tone = 'amber', onClick, disabled = false }) {
  const tones = {
    cyan: 'border-cyan-300 text-cyan-700 hover:bg-cyan-50',
    amber: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    red: 'border-red-300 text-red-700 hover:bg-red-50',
  };
  return <button type="button" disabled={disabled} onClick={onClick} className={classNames('inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50', tones[tone])}>{children}</button>;
}
