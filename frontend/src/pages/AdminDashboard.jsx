import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../api'
import Navbar from '../components/Navbar'
import ReportDrawer from '../components/ReportDrawer'

const DEPARTMENTS = ['Unassigned','Maintenance','Electrical','Security','IT','Administration']
const ETA_OPTIONS = ['','1 hour','4 hours','8 hours','1 day','2 days','3 days']

const severityColor = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-orange-400', critical: 'text-red-400' }
const severityBg    = { low: 'bg-green-900/40', medium: 'bg-yellow-900/40', high: 'bg-orange-900/40', critical: 'bg-red-900/40' }
const statusColor   = { pending: 'text-yellow-400', 'in-progress': 'text-blue-400', resolved: 'text-green-400' }
const barColor      = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500' }
const categoryIcons = { infrastructure: '🏗️', electrical: '⚡', water: '💧', overcrowding: '👥', safety: '🛡️', other: '📋' }
const etaHours      = { '1 hour': 1, '4 hours': 4, '8 hours': 8, '1 day': 24, '2 days': 48, '3 days': 72 }

function isOverdue(r) {
  if (!r.eta || !r.etaSetAt || r.status === 'resolved') return false
  return (Date.now() - new Date(r.etaSetAt)) / 3600000 > (etaHours[r.eta] || 0)
}

export default function AdminDashboard({ notifications, onClearNotifications, onOpenReport, addNotification, openReportId, setOpenReportId }) {
  const navigate = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [drawerReport, setDrawerReport] = useState(null)
  const [search, setSearch] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (user.role !== 'admin') { navigate('/'); return }
    fetchData()
  }, [])

  useEffect(() => {
    if (openReportId && reports.length > 0) {
      const r = reports.find(x => x._id === openReportId)
      if (r) { setDrawerReport(r); setOpenReportId(null) }
    }
  }, [openReportId, reports])

  const fetchData = async () => {
    try {
      const [s, r] = await Promise.all([API.get('/admin/stats'), API.get('/admin/reports')])
      setStats(s.data)
      setReports(r.data)
    } catch { toast.error('Failed to load dashboard') }
    finally  { setLoading(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      const { data } = await API.put(`/reports/${id}/status`, { status })
      setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r))
      toast.success('Status updated')
      addNotification('status', 'Status Updated', `Report marked as ${status}`, id)
      if (status === 'resolved') addNotification('resolved', 'Report Resolved', data.title, id)
    } catch { toast.error('Failed to update') }
  }

  const updateDepartment = async (id, dept) => {
    try {
      await API.put(`/reports/${id}/assign`, { assignedDepartment: dept })
      setReports(prev => prev.map(r => r._id === id ? { ...r, assignedDepartment: dept } : r))
      toast.success('Department assigned')
      addNotification('assigned', 'Department Assigned', `Assigned to ${dept}`, id)
    } catch { toast.error('Failed to assign') }
  }

  const updateEta = async (id, eta) => {
    try {
      await API.put(`/reports/${id}/eta`, { eta })
      setReports(prev => prev.map(r => r._id === id ? { ...r, eta, etaSetAt: new Date() } : r))
      toast.success('ETA set')
      if (eta) addNotification('eta', 'ETA Updated', `Resolution in ${eta}`, id)
    } catch { toast.error('Failed to set ETA') }
  }

  const deleteReport = async (id) => {
    if (!confirm('Delete this report?')) return
    try {
      await API.delete(`/reports/${id}`)
      setReports(prev => prev.filter(r => r._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  const filtered = reports.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.location.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen bg-[#0b1120]">
      <Navbar notifications={notifications} onClearNotifications={onClearNotifications} onOpenReport={onOpenReport} />
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b1120]">
      <Navbar notifications={notifications} onClearNotifications={onClearNotifications} onOpenReport={(id) => { const r = reports.find(x => x._id === id); if (r) setDrawerReport(r) }} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Welcome back, {user.name}</p>
          </div>
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm transition-colors">
            🔄 Refresh
          </button>
        </div>

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { key: 'total',      label: 'Total',       color: 'text-white',        bg: 'bg-slate-800/60'      },
              { key: 'pending',    label: 'Pending',     color: 'text-yellow-400',   bg: 'bg-yellow-900/20'     },
              { key: 'inProgress', label: 'In Progress', color: 'text-blue-400',     bg: 'bg-blue-900/20'       },
              { key: 'resolved',   label: 'Resolved',    color: 'text-green-400',    bg: 'bg-green-900/20'      },
              { key: 'critical',   label: 'Critical',    color: 'text-red-400',      bg: 'bg-red-900/20'        },
              { key: 'users',      label: 'Users',       color: 'text-indigo-400',   bg: 'bg-indigo-900/20'     },
            ].map(({ key, label, color, bg }) => (
              <div key={key} className={`${bg} rounded-2xl p-4 border border-slate-700/50`}>
                <p className="text-slate-400 text-xs mb-2">{label}</p>
                <p className={`text-3xl font-semibold ${color}`}>{stats[key] ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111827] p-1 rounded-xl mb-6 w-fit border border-[#1f2937]">
          {['overview', 'reports'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111827] rounded-2xl p-6 border border-[#1f2937]">
              <h3 className="text-sm font-medium text-white mb-5">By Category</h3>
              <div className="space-y-4">
                {stats.byCategory.map(({ _id, count }) => (
                  <div key={_id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-300 text-sm flex items-center gap-2 capitalize">
                        {categoryIcons[_id]} {_id}
                      </span>
                      <span className="text-slate-400 text-sm">{count}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.round((count/stats.total)*100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111827] rounded-2xl p-6 border border-[#1f2937]">
              <h3 className="text-sm font-medium text-white mb-5">By Severity</h3>
              <div className="space-y-4">
                {stats.bySeverity.map(({ _id, count }) => (
                  <div key={_id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm capitalize font-medium ${severityColor[_id]}`}>{_id}</span>
                      <span className="text-slate-400 text-sm">{count}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className={`${barColor[_id]} h-2 rounded-full`} style={{ width: `${Math.round((count/stats.total)*100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111827] rounded-2xl p-6 border border-[#1f2937] md:col-span-2">
              <h3 className="text-sm font-medium text-white mb-4">Recent Reports</h3>
              <div className="space-y-3">
                {reports.slice(0, 5).map(r => (
                  <div key={r._id} onClick={() => setDrawerReport(r)}
                    className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-800/70 transition-colors">
                    <span className="text-xl">{categoryIcons[r.category]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{r.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{r.location} · {r.reportedBy?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${severityBg[r.severity]} ${severityColor[r.severity]}`}>{r.severity}</span>
                      <span className={`text-xs capitalize ${statusColor[r.status]}`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports table */}
        {activeTab === 'reports' && (
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f2937] flex items-center justify-between gap-4">
              <h3 className="font-medium text-white whitespace-nowrap">All Reports ({filtered.length})</h3>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search title or location..."
                className="bg-[#0b1120] border border-[#1f2937] rounded-xl px-4 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f2937] bg-slate-800/20">
                    {['Report','Severity','Status','Department','ETA','By','Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-400 font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const overdue = isOverdue(r)
                    return (
                      <tr key={r._id} className="border-b border-[#1f2937]/50 hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 cursor-pointer" onClick={() => setDrawerReport(r)}>
                          <p className="text-white text-sm font-medium max-w-[160px] truncate hover:text-indigo-300 transition-colors">{r.title}</p>
                          <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[160px]">{r.location}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${severityBg[r.severity]} ${severityColor[r.severity]}`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select value={r.status} onChange={e => updateStatus(r._id, e.target.value)}
                            className={`bg-slate-800 border border-slate-700 rounded-lg text-xs px-2 py-1.5 outline-none cursor-pointer ${statusColor[r.status]}`}>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select value={r.assignedDepartment || 'Unassigned'} onChange={e => updateDepartment(r._id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg text-xs px-2 py-1.5 outline-none cursor-pointer text-indigo-300 max-w-[130px]">
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select value={r.eta || ''} onChange={e => updateEta(r._id, e.target.value)}
                            className={`bg-slate-800 border border-slate-700 rounded-lg text-xs px-2 py-1.5 outline-none cursor-pointer max-w-[110px] ${overdue ? 'text-red-400' : 'text-slate-300'}`}>
                            {ETA_OPTIONS.map(e => <option key={e} value={e}>{e || 'Set ETA'}</option>)}
                          </select>
                          {overdue && <p className="text-red-400 text-xs mt-0.5">Overdue</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{r.reportedBy?.name}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteReport(r._id)}
                            className="text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors">
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">No reports found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {drawerReport && (
        <ReportDrawer report={drawerReport} onClose={() => setDrawerReport(null)} />
      )}
    </div>
  )
}