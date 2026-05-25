export function SectionTitle({ icon: Icon, title, description }) {
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
