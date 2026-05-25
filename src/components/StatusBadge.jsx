import { classNames } from '../utils/formatters.js';

export function StatusBadge({ value }) {
  const status = String(value || '-').toLowerCase();
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    opened: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    processing: 'bg-blue-50 text-blue-700 ring-blue-200',
    reply: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    pending_payment: 'bg-amber-50 text-amber-700 ring-amber-200',
    payment_processing: 'bg-blue-50 text-blue-700 ring-blue-200',
    failed: 'bg-red-50 text-red-700 ring-red-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
    expired: 'bg-slate-100 text-slate-600 ring-slate-200',
    inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return <span className={classNames('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', styles[status] || styles.active)}>{value || '-'}</span>;
}
