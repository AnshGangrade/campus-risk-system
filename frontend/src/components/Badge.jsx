export const severityBadge = {
  low:      'bg-emerald-950 text-emerald-400 border border-emerald-800/40',
  medium:   'bg-yellow-950  text-yellow-400  border border-yellow-800/40',
  high:     'bg-orange-950  text-orange-400  border border-orange-800/40',
  critical: 'bg-red-950     text-red-400     border border-red-800/40',
}
export const statusBadge = {
  pending:       'bg-yellow-950 text-yellow-400  border border-yellow-800/40',
  'in-progress': 'bg-blue-950   text-blue-400    border border-blue-800/40',
  resolved:      'bg-emerald-950 text-emerald-400 border border-emerald-800/40',
}
export const roleBadge = {
  SUPER_ADMIN: 'bg-red-950    text-red-400    border border-red-800/40',
  ADMIN:       'bg-violet-950 text-violet-400 border border-violet-800/40',
  USER:        'bg-slate-800  text-slate-400  border border-slate-700/40',
}

export default function Badge({ label, variant = 'default', className = '' }) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  return <span className={`${base} ${variant} ${className}`}>{label}</span>
}