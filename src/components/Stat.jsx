import { Card } from './Card.jsx';
import { classNames } from '../utils/formatters.js';

export function Stat({ label, value, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-950 text-white',
    emerald: 'bg-emerald-600 text-white',
    blue: 'bg-blue-600 text-white',
    amber: 'bg-amber-500 text-slate-950',
    cyan: 'bg-cyan-600 text-white',
    red: 'bg-red-600 text-white',
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={classNames('rounded-2xl p-3', tones[tone])}>{Icon ? <Icon size={22} /> : null}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-950">{value}</p>
      </div>
    </Card>
  );
}
