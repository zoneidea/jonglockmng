export function PageLoadingFallback({ title = 'กำลังโหลดหน้า', description = 'ระบบกำลังเตรียมข้อมูลและส่วนประกอบของหน้านี้' }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
        <div>
          <p className="text-base font-extrabold text-slate-950">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
