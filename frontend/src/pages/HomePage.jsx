import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../api'
import Navbar from '../components/Navbar'
import ReportDrawer from '../components/ReportDrawer'

const severityConfig = {
  low:      { bg: 'bg-green-900/40',  text: 'text-green-400',  dot: 'bg-green-400'  },
  medium:   { bg: 'bg-yellow-900/40', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  high:     { bg: 'bg-orange-900/40', text: 'text-orange-400', dot: 'bg-orange-400' },
  critical: { bg: 'bg-red-900/40',    text: 'text-red-400',    dot: 'bg-red-400'    },
}
const statusConfig = {
  pending:       { bg: 'bg-yellow-900/40', text: 'text-yellow-400' },
  'in-progress': { bg: 'bg-blue-900/40',   text: 'text-blue-400'   },
  resolved:      { bg: 'bg-green-900/40',  text: 'text-green-400'  },
}
const categoryIcons = {
  infrastructure: '🏗️', electrical: '⚡', water: '💧',
  overcrowding: '👥', safety: '🛡️', other: '📋'
}
const etaHours = { '1 hour': 1, '4 hours': 4, '8 hours': 8, '1 day': 24, '2 days': 48, '3 days': 72 }

function isOverdue(r) {
  if (!r.eta || !r.etaSetAt || r.status === 'resolved') return false
  return (Date.now() - new Date(r.etaSetAt)) / 3600000 > (etaHours[r.eta] || 0)
}

export default function HomePage({ notifications, onClearNotifications, onOpenReport, addNotification, openReportId, setOpenReportId }) {
  const navigate = useNavigate()
  const [reports, setReports]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [drawerReport, setDrawerReport] = useState(null)
  const [filter, setFilter]         = useState({ category: '', status: '', severity: '' })
  const user = JSON.parse(localStorage.getItem('user') || '{}')

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
      if (r) { setDrawerReport(r); setOpenReportId(null) }
    }
  }, [openReportId, reports])

  const upvote = async (e, id) => {
    e.stopPropagation()
    try {
      const { data } = await API.put(`/reports/${id}/upvote`)
      setReports(prev => prev.map(r =>
        r._id === id ? { ...r, upvoteCount: data.upvoteCount,
          upvotes: data.upvoted ? [...r.upvotes, user.id] : r.upvotes.filter(u => u !== user.id) } : r
      ))
      if (data.upvoted) addNotification('report', 'Upvote Added', `You upvoted a report`, id)
    } catch { toast.error('Login required to upvote') }
  }

  return (
    <div className="min-h-screen bg-[#0b1120]">
      <Navbar notifications={notifications} onClearNotifications={onClearNotifications} onOpenReport={(id) => { const r = reports.find(x => x._id === id); if (r) setDrawerReport(r) }} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Campus Reports</h1>
            <p className="text-slate-400 text-sm mt-0.5">{reports.length} active reports</p>
          </div>
          <button onClick={() => navigate('/report')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            🚨 Report Issue
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { key: 'category', options: ['infrastructure','electrical','water','overcrowding','safety','other'], label: 'Category' },
            { key: 'status',   options: ['pending','in-progress','resolved'],                                   label: 'Status'   },
            { key: 'severity', options: ['low','medium','high','critical'],                                     label: 'Severity' },
          ].map(({ key, options, label }) => (
            <select key={key} value={filter[key]}
              onChange={e => setFilter({ ...filter, [key]: e.target.value })}
              className="bg-[#111827] border border-[#1f2937] text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500">
              <option value="">{label}: All</option>
              {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
          ))}
        </div>

        {loading
          ? <div className="text-center py-20 text-slate-400">Loading reports...</div>
          : reports.length === 0
            ? <div className="text-center py-20">
                <p className="text-5xl mb-4">🏫</p>
                <p className="text-white font-medium text-lg">Campus is safe</p>
                <p className="text-slate-500 text-sm mt-1">No reports match your filters</p>
                <button onClick={() => navigate('/report')} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">Submit a report →</button>
              </div>
            : <div className="space-y-4">
                {reports.map(r => {
                  const sev     = severityConfig[r.severity] || severityConfig.medium
                  const sta     = statusConfig[r.status]     || statusConfig.pending
                  const overdue = isOverdue(r)
                  return (
                    <div key={r._id}
                      onClick={() => setDrawerReport(r)}
                      className="bg-[#111827] rounded-2xl p-5 border border-[#1f2937] hover:border-slate-600 transition-all cursor-pointer hover:scale-[1.005] group">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                          {categoryIcons[r.category] || '📋'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-medium text-white text-sm leading-snug">{r.title}</h3>
                            <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${sev.bg} ${sev.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`}></span>
                                {r.severity}
                              </span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sta.bg} ${sta.text}`}>
                                {r.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-500 text-xs line-clamp-2 mb-3">{r.description}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-slate-500 text-xs flex items-center gap-1">📍 {r.location}</span>
                            <span className="text-slate-600 text-xs">by {r.reportedBy?.name}</span>
                            <span className="text-slate-600 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                            {r.assignedDepartment && r.assignedDepartment !== 'Unassigned' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-400 border border-indigo-800/30">
                                {r.assignedDepartment}
                              </span>
                            )}
                            {r.eta && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${overdue ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                                {overdue ? 'Overdue' : `ETA: ${r.eta}`}
                              </span>
                            )}
                          </div>
                        </div>
                        {r.image && (
                          <img src={`http://localhost:5000${r.image}`} alt="report"
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-slate-700" />
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#1f2937] flex items-center justify-between">
                        <button
                          onClick={(e) => upvote(e, r._id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            r.upvotes?.includes(user.id)
                              ? 'bg-indigo-900/40 text-indigo-300'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}>
                          ▲ {r.upvoteCount} upvotes
                        </button>
                        <span className="text-xs text-slate-600 capitalize">{r.category}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
        }
      </div>

      {drawerReport && (
        <ReportDrawer report={drawerReport} onClose={() => setDrawerReport(null)} />
      )}
    </div>
  )
}