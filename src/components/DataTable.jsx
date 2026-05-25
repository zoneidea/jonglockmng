import { useState, useEffect } from 'react';
import { EmptyState } from './EmptyState.jsx';

function SmallButton({ children, tone = 'slate', onClick, disabled = false }) {
  const classNames = (...values) => values.filter(Boolean).join(' ');
  const tones = {
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-100',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100',
  };
  return <button type="button" disabled={disabled} onClick={onClick} className={classNames('inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50', tones[tone])}>{children}</button>;
}

export function DataTable({ columns, rows }) {
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
