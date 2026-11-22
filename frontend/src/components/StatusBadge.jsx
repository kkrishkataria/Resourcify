import React from 'react';
import { formatStatus } from '../utils/formatters.js';

export default function StatusBadge({ status, className = '' }) {
  const styles = {
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    CHECKED_IN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    NO_SHOW: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
    DISABLED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const currentStyle = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {formatStatus(status)}
    </span>
  );
}
