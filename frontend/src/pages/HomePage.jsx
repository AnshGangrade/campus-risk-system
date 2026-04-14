import { useState, useEffect }  from 'react'
import { useNavigate }           from 'react-router-dom'
import toast                     from 'react-hot-toast'
import {
  MapPin, ChevronUp, Filter, AlertTriangle,
  FileWarning, Trash2, X, Clock
} from 'lucide-react'
import API          from '../api'
import Navbar       from '../components/Navbar'
import ReportDrawer from '../components/ReportDrawer'
import Avatar       from '../components/Avatar'
import Badge, { severityBadge, statusBadge } from '../components/Badge'

const categorySymbols = {
  infrastructure: '▲', electrical: '◈', water: '◉',
  overcrowding: '◎', safety: '◆', other: '◇'
}

const etaHours = {
  '1 hour': 1, '4 hours': 4, '8 hours': 8,
  '1 day': 24, '2 days': 48, '3 days': 72
}

function isOverdue(r) {
  if (!r.eta || !r.etaSetAt || r.status === 'resolved') return false
  return (Date.now() - new Date(r.etaSetAt)) / 3600000 > (etaHours[r.eta] || 0)
}

function DeleteModal({ report, onConfirm, onCancel, loading }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onCancel} />
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div className="w-full max-w-sm rounded-2xl p-6 fade-in"
          style={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-900/30 flex items-center justify-center">
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Delete Report</p>
                <p className="text-slate-500 text-xs">This action cannot be undone</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 mb-5 border border-white/[0.06]">
            <p className="text-slate-300 text-xs line-clamp-2">{report.title}</p>
            <p className="text-slate-600 text-xs mt-1 flex items-center gap-1">
              <MapPin size={9} /> {report.location}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-slate-400 text-sm border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function HomePage({
  notifications, onClearNotifications, onOpenReport,
  addNotification, openReportId, setOpenReportId
}) {
  const navigate = useNavigate()
  const [reports,       setReports]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [drawerReport,  setDrawerReport]  = useState(null)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filter, setFilter] = useState({ category: '', status: '', severity: '' })
  const user     = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin  = ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.category) params.append('category', filter.category)
      if (filter.status)   params.append('status',   filter.status)
      if (filter.severity) params.append('severity', filter.severity)
      const { data } = await API.get(`/reports?${params}`)
      setReports(data)
    } catch { toast.error('Failed to load reports') }
    finally  { setLoading(false) }
  }

  useEffect(() => { fetchReports() }, [filter])

  useEffect(() => {
    if (openReportId && reports.length > 0) {
      const r = reports.find(x => x._id === openReportId)
      if (r) { setDrawerReport(r); setOpenReportId?.(null) }
    }
  }, [openReportId, reports])

  const upvote = async (e, id) => {
    e.stopPropagation()
    try {
      const { data } = await API.put(`/reports/${id}/upvote`)
      setReports(prev => prev.map(r =>
        r._id === id
          ? { ...r, upvoteCount: data.upvoteCount,
              upvotes: data.upvoted
                ? [...(r.upvotes || []), user.id]
                : (r.upvotes || []).filter(u => u !== user.id)
            }
          : r
      ))
    } catch { toast.error('Login required') }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await API.delete(`/reports/${deleteTarget._id}`)
      setReports(prev => prev.filter(r => r._id !== deleteTarget._id))
      toast.success('Report deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally {
      setDeleteLoading(false)
    }
  }

  const canDelete = (report) => {
    if (isAdmin) return true
    return report.reportedBy?._id === user.id || report.reportedBy === user.id
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar
        notifications={notifications}
        onClearNotifications={onClearNotifications}
        onOpenReport={id => {
          const r = reports.find(x => x._id === id)
          if (r) setDrawerReport(r)
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileWarning size={18} className="text-violet-400" />
              <h1 className="text-xl font-semibold text-white tracking-tight">Campus Reports</h1>
            </div>
            <p className="text-slate-500 text-sm">{reports.length} reports</p>
          </div>
          <button onClick={() => navigate('/report')}
            className="flex items-center gap-2 bg-violet-700 hover:bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <AlertTriangle size={14} /> New Report
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap items-center">
          <span className="text-slate-600 text-xs flex items-center gap-1.5">
            <Filter size={11} /> Filter
          </span>
          {[
            { key: 'category', opts: ['infrastructure','electrical','water','overcrowding','safety','other'], label: 'Category' },
            { key: 'status',   opts: ['pending','in-progress','resolved'],                                    label: 'Status'   },
            { key: 'severity', opts: ['low','medium','high','critical'],                                      label: 'Severity' },
          ].map(({ key, opts, label }) => (
            <select key={key} value={filter[key]}
              onChange={e => setFilter({ ...filter, [key]: e.target.value })}
              className="bg-[#0b1220] border border-white/[0.06] text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-violet-600/40 cursor-pointer">
              <option value="">{label}: All</option>
              {opts.map(o => (
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
              ))}
            </select>
          ))}
          {(filter.category || filter.status || filter.severity) && (
            <button onClick={() => setFilter({ category: '', status: '', severity: '' })}
              className="text-xs text-violet-400 hover:text-violet-300 px-2 py-1 transition-colors flex items-center gap-1">
              <X size={11} /> Clear
            </button>
          )}
        </div>

        {/* Report list */}
        {loading
          ? <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          : reports.length === 0
            ? <div className="text-center py-20">
                <AlertTriangle size={36} className="text-slate-700 mx-auto mb-3" />
                <p className="text-white font-medium text-sm">No reports found</p>
                <p className="text-slate-500 text-xs mt-1">Campus is safe or adjust your filters</p>
                <button onClick={() => navigate('/report')}
                  className="mt-4 text-violet-400 hover:text-violet-300 text-xs transition-colors">
                  Submit a report →
                </button>
              </div>
            : <div className="space-y-3">
                {reports.map((r, idx) => {
                  const overdue = isOverdue(r)
                  return (
                    <div key={r._id}
                      onClick={() => setDrawerReport(r)}
                      className="card p-5 cursor-pointer fade-in"
                      style={{ animationDelay: `${idx * 0.03}s` }}>
                      <div className="flex items-start gap-4">

                        {/* Category symbol */}
                        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-500 text-sm font-mono flex-shrink-0">
                          {categorySymbols[r.category] || '◇'}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title + badges */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-white text-sm font-medium leading-snug">{r.title}</h3>
                            <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                              <Badge label={r.severity} variant={severityBadge[r.severity]} />
                              <Badge label={r.status}   variant={statusBadge[r.status]}   />
                              {overdue && (
                                <Badge label="Overdue" variant="bg-red-950 text-red-400 border border-red-900/40" />
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-slate-500 text-xs line-clamp-2 mb-3 leading-relaxed">
                            {r.description}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-slate-600 text-xs flex items-center gap-1">
                              <MapPin size={10} /> {r.location}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Avatar user={r.reportedBy} size="sm" />
                              <span className="text-slate-600 text-xs">{r.reportedBy?.name}</span>
                            </div>
                            <span className="text-slate-700 text-xs flex items-center gap-1">
                              <Clock size={9} />
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                            {r.assignedDepartment && r.assignedDepartment !== 'Unassigned' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-950/40 text-violet-400 border border-violet-900/30">
                                {r.assignedDepartment}
                              </span>
                            )}
                            {r.eta && (
                              <span className={`text-xs ${overdue ? 'text-red-400' : 'text-slate-600'}`}>
                                ETA: {r.eta}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Image preview */}
                        {r.image && (
                          <img
                            src={`${API_BASE}${r.image}`}
                            alt="report"
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-white/[0.06]"
                          />
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                        <button
                          onClick={e => upvote(e, r._id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            r.upvotes?.includes(user.id)
                              ? 'bg-violet-900/30 text-violet-300 border border-violet-800/30'
                              : 'bg-white/[0.03] text-slate-500 hover:text-white border border-white/[0.05]'
                          }`}>
                          <ChevronUp size={12} /> {r.upvoteCount}
                        </button>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-700 capitalize font-mono">{r.category}</span>
                          {canDelete(r) && (
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteTarget(r) }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900/20 transition-all">
                              <Trash2 size={11} />
                              {isAdmin ? 'Delete' : 'Delete mine'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
        }
      </div>

      {/* Drawer */}
      {drawerReport && (
        <ReportDrawer report={drawerReport} onClose={() => setDrawerReport(null)} />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteModal
          report={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}