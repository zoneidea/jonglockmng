export default function BankSelect({ label = 'ธนาคาร', banks = [], value = '', onChange,
  loading = false, disabled = false, required = false, legacyName = '' }) {
  const known = banks.some(bank => bank.code === value);
  return <label className="block">
    <span className="mb-1.5 block text-sm font-bold text-slate-600">{label}</span>
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}
      required={required} disabled={disabled || loading}
      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60">
      <option value="">{loading ? 'กำลังโหลดธนาคาร…' : legacyName && !value ? `${legacyName} (ข้อมูลเดิม)` : 'เลือกธนาคาร'}</option>
      {value && !known ? <option value={value}>{value} · {legacyName || 'ธนาคารของบัญชีเดิม'}</option> : null}
      {banks.map(bank => <option key={bank.code} value={bank.code}>{bank.code} · {bank.nameTh} ({bank.shortName})</option>)}
    </select>
  </label>;
}
