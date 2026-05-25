export function EmptyState({ title = 'ไม่พบข้อมูล', description = 'ยังไม่มีรายการสำหรับเงื่อนไขนี้' }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
