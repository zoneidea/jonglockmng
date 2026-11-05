import { useId } from 'react';

export default function MarketCollectionField({ value, onChange, disabled = false }) {
  const name = useId();
  return <fieldset disabled={disabled}>
    <legend className="mb-2 text-sm font-bold text-slate-600">การเก็บเงิน</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        ['self', 'เก็บเงินเอง', 'ไม่แสดงตลาดนี้ในแอปฯ ผู้ค้า'],
        ['system', 'ชำระผ่านระบบ', 'แสดงให้ผู้ค้าจองและชำระเงินตามการตั้งค่าองค์กร'],
      ].map(([mode, label, hint]) => <label key={mode} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${value === mode ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'}`}>
        <input type="radio" name={name} value={mode} checked={value === mode} onChange={() => onChange(mode)} className="mt-1 accent-cyan-600" />
        <span><span className="block text-sm font-bold text-slate-800">{label}</span><span className="mt-1 block text-xs text-slate-500">{hint}</span></span>
      </label>)}
    </div>
  </fieldset>;
}
