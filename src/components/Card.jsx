import { classNames } from '../utils/formatters.js';

export function Card({ children, className = '' }) {
  return <div className={classNames('rounded-3xl border border-slate-200 bg-white p-6 shadow-soft', className)}>{children}</div>;
}
