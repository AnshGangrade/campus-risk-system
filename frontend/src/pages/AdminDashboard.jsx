import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import toast                   from 'react-hot-toast'
import {
  LayoutDashboard, FileWarning, Users, BarChart3,
  RefreshCw, Trash2, ShieldPlus, ChevronDown, MapPin,
  AlertTriangle, CheckCircle, Clock, Activity
} from 'lucide-react'
import API          from '../api'
import Navbar       from '../components/Navbar'
import ReportDrawer from '../components/ReportDrawer'
import Avatar       from '../components/Avatar'
import Badge, { severityBadge, statusBadge, roleBadge } from '../components/Badge'

const DEPARTMENTS = ['Unassigned','Maintenance','Electrical','Security','IT','Administration']
const ETA_OPTIONS = ['','1 hour','4 hours','8 hours','1 day','2 days','3 days']
const etaHours    = { '1 hour': 1, '4 hours': 4, '8 hours': 8, '1 day': 24, '2 days': 48, '3 days': 72 }

const categoryIcons = {
  infrastructure: AlertTriangle, electrical: Activity, water: Activity,
  overcrowding: Users, safety: ShieldPlus, other: FileWarning
}

function isOverdue(r) {
  if (!r.eta || !r.etaSetAt || r.status === 'resolved') return false
  return (Date.now() - new Date(r.etaSetAt)) / 3600000 > (etaHours[r.eta] || 0)
}

const statCards = [
  { key: 'total',      label: 'Total',       Icon: FileWarning,   accent: 'text-slate-300',  bg: 'border-white/[0.06]'        },
  { key: 'pending',    label: 'Pending',      Icon: Clock,         accent: 'text-yellow-400', bg: 'border-yellow-900/30'       },
  { key: 'inProgress', label: 'In Progress',  Icon: Activity,      accent: 'text-blue-400',   bg: 'border-blue-900/30'         },
  { key: 'resolved',   label: 'Resolved',     Icon: CheckCircle,   accent: 'text-emerald-400',bg: 'border-emerald-900/30'      },
  { key: 'critical',   label: 'Critical',     Icon: AlertTriangle, accent: 'text-red-400',    bg: 'border-red-900/30'          },
  { key: 'users',      label: 'Users',        Icon: Users,         accent: 'text-violet-400', bg: 'border-violet-900/30'       },
]

export default function AdminDashboard({ notifications, onClearNotifications, onOpenReport, addNotification, openReportId, setOpenReportId }) {
  const navigate = useNavigate()
  const [stats,        setStats]        = useState(null)
  const [reports,      setReports]      = useState([])
  const [users,        setUsers]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('overview')
  const [drawerReport, setDrawerReport] = useState(null)
  const [search,       setSearch]       = useState('')
  const [showCreate,   setShowCreate]   = useState(false)
  const [adminForm,    setAdminForm]    = useState({ name: '', email: '', password: '', department: '' })
  const [creating,     setCreating]     = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!['ADMIN','SUPER_ADMIN'].includes(user.role)) { navigate('/'); return }
    fetchData()
  }, [])

  useEffect(() => {
    if (openReportId && reports.length > 0) {
      const r = reports.find(x => x._id === openReportId)
      if (r) { setDrawerReport(r); setOpenReportId(null) }
    }
  }, [openReportId, reports])

  const fetchData = async () => {
    setLoading(true)
    try {
      const calls = [API.get('/admin/stats'), API.get('/admin/reports')]
      if (user.role === 'SUPER_ADMIN') calls.push(API.get('/admin/users'))
      const results = await Promise.all(calls)
      setStats(results[0].data)
      setReports(results[1].data)
      if (results[2]) setUsers(results[2].data)
    } catch { toast.error('Failed to load dashboard') }
    finally  { setLoading(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/reports/${id}/status`, { status })
      setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r))
      toast.success('Status updated')
      addNotification?.('status', 'Status Updated', `Report marked as ${status}`, id)
    } catch { toast.error('Failed to update') }
  }

  const updateDepartment = async (id, dept) => {
    try {
      await API.put(`/reports/${id}/assign`, { assignedDepartment: dept })
      setReports(prev => prev.map(r => r._id === id ? { ...r, assignedDepartment: dept } : r))
      toast.success('Department assigned')
      addNotification?.('assigned', 'Assigned', `Report assigned to ${dept}`, id)
    } catch { toast.error('Failed to assign') }
  }

  const updateEta = async (id, eta) => {
    try {
      await API.put(`/reports/${id}/eta`, { eta })
      setReports(prev => prev.map(r => r._id === id ? { ...r, eta, etaSetAt: new Date() } : r))
      toast.success('ETA set')
    } catch { toast.error('Failed to set ETA') }
  }

  const deleteReport = async (id) => {
    if (!confirm('Delete this report?')) return
    try {
      await API.delete(`/reports/${id}`)
      setReports(prev => prev.filter(r => r._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const createAdmin = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await API.post('/admin/create-admin', adminForm)
      toast.success('Admin account created')
      setShowCreate(false)
      setAdminForm({ name: '', email: '', password: '', department: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin')
    } finally { setCreating(false) }
  }

  const filtered = reports.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.location.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { key: 'overview', label: 'Overview',  Icon: LayoutDashboard },
    { key: 'reports',  label: 'Reports',   Icon: FileWarning },
    { key: 'analytics',label: 'Analytics', Icon: BarChart3 },
    ...(user.role === 'SUPER_ADMIN' ? [{ key: 'users', label: 'Users', Icon: Users }] : []),
  ]

  const inputCls = "w-full bg-[#020617] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-600/50 transition-colors"

  if (loading) return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar notifications={notifications} onClearNotifications={onClearNotifications} onOpenReport={onOpenReport} />
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar notifications={notifications} onClearNotifications={onClearNotifications}
        onOpenReport={id => { const r = reports.find(x => x._id === id); if (r) setDrawerReport(r) }} />

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard size={18} className="text-violet-400" />
              <h1 className="text-xl font-semibold text-white tracking-tight">Dashboard</h1>
            </div>
            <p className="text-slate-500 text-sm">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'SUPER_ADMIN' && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-medium transition-colors">
                <ShieldPlus size={15} /> Create Admin
              </button>
            )}
            <button onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300 rounded-xl text-sm transition-colors">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {statCards.map(({ key, label, Icon, accent, bg }) => (
              <div key={key} className={`card p-4 border ${bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-500 text-xs font-medium">{label}</p>
                  <Icon size={14} className={accent} />
                </div>
                <p className={`text-2xl font-bold ${accent}`}>{stats[key] ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium tracking-wide transition-all ${
                activeTab === key
                  ? 'bg-violet-700 text-white'
                  : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'
              }`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">By Category</h3>
              <div className="space-y-3">
                {stats.byCategory.map(({ _id, count }) => {
                  const Icon = categoryIcons[_id] || FileWarning
                  return (
                    <div key={_id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-300 text-xs flex items-center gap-2 capitalize">
                          <Icon size={12} className="text-slate-500" />{_id}
                        </span>
                        <span className="text-slate-500 text-xs">{count}</span>
                      </div>
                      <div className="w-full bg-white/[0.04] rounded-full h-1.5">
                        <div className="bg-violet-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.round((count / stats.total) * 100)}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">By Severity</h3>
              <div className="space-y-3">
                {stats.bySeverity.map(({ _id, count }) => {
                  const barColors = { low: 'bg-emerald-500', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500' }
                  return (
                    <div key={_id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs capitalize font-medium text-slate-300">{_id}</span>
                        <span className="text-slate-500 text-xs">{count}</span>
                      </div>
                      <div className="w-full bg-white/[0.04] rounded-full h-1.5">
                        <div className={`${barColors[_id]} h-1.5 rounded-full transition-all`}
                          style={{ width: `${Math.round((count / stats.total) * 100)}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-5 md:col-span-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {reports.slice(0, 6).map(r => (
                  <div key={r._id} onClick={() => setDrawerReport(r)}
                    className="flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={13} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{r.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        <MapPin size={10} /> {r.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={r.severity} variant={severityBadge[r.severity]} />
                      <Badge label={r.status}   variant={statusBadge[r.status]}   />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports table */}
        {activeTab === 'reports' && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
              <p className="text-white text-sm font-medium">All Reports <span className="text-slate-500 font-normal">({filtered.length})</span></p>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-[#020617] border border-white/[0.06] rounded-xl px-4 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-600/40 w-56" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Report','Severity','Status','Department','ETA','Reporter','Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-500 font-medium px-4 py-3 tracking-wider uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const overdue = isOverdue(r)
                    return (
                      <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 cursor-pointer" onClick={() => setDrawerReport(r)}>
                          <p className="text-white text-xs font-medium max-w-[160px] truncate hover:text-violet-300 transition-colors">{r.title}</p>
                          <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1 truncate max-w-[160px]">
                            <MapPin size={9} /> {r.location}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={r.severity} variant={severityBadge[r.severity]} />
                        </td>
                        <td className="px-4 py-3">
                          <select value={r.status} onChange={e => updateStatus(r._id, e.target.value)}
                            className="bg-[#020617] border border-white/[0.06] rounded-lg text-xs px-2 py-1.5 text-slate-300 outline-none cursor-pointer">
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select value={r.assignedDepartment || 'Unassigned'} onChange={e => updateDepartment(r._id, e.target.value)}
                            className="bg-[#020617] border border-white/[0.06] rounded-lg text-xs px-2 py-1.5 text-violet-300 outline-none cursor-pointer max-w-[130px]">
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select value={r.eta || ''} onChange={e => updateEta(r._id, e.target.value)}
                            className={`bg-[#020617] border border-white/[0.06] rounded-lg text-xs px-2 py-1.5 outline-none cursor-pointer max-w-[100px] ${overdue ? 'text-red-400' : 'text-slate-400'}`}>
                            {ETA_OPTIONS.map(o => <option key={o} value={o}>{o || 'Set ETA'}</option>)}
                          </select>
                          {overdue && <p className="text-red-400 text-xs mt-0.5">Overdue</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar user={r.reportedBy} size="sm" />
                            <span className="text-slate-400 text-xs truncate max-w-[80px]">{r.reportedBy?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteReport(r._id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <FileWarning size={28} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No reports found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Resolution Rate', value: stats.total ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '0%', sub: `${stats.resolved} of ${stats.total} resolved`, color: 'text-emerald-400' },
              { label: 'Critical Rate',   value: stats.total ? `${Math.round((stats.critical / stats.total) * 100)}%` : '0%', sub: `${stats.critical} critical issues`,             color: 'text-red-400'     },
              { label: 'Pending Rate',    value: stats.total ? `${Math.round((stats.pending  / stats.total) * 100)}%` : '0%', sub: `${stats.pending} awaiting action`,              color: 'text-yellow-400'  },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="card p-6">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">{label}</p>
                <p className={`text-4xl font-bold ${color} mb-1`}>{value}</p>
                <p className="text-slate-600 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users (SUPER_ADMIN only) */}
        {activeTab === 'users' && user.role === 'SUPER_ADMIN' && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-white text-sm font-medium">All Users <span className="text-slate-500 font-normal">({users.length})</span></p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {users.map(u => (
                <div key={u._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar user={u} size="md" />
                    <div>
                      <p className="text-white text-sm font-medium">{u.name}</p>
                      <p className="text-slate-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge label={u.role} variant={roleBadge[u.role]} />
                    {u.role !== 'SUPER_ADMIN' && (
                      <button onClick={async () => {
                        if (!confirm(`Delete ${u.name}?`)) return
                        try { await API.delete(`/admin/users/${u._id}`); fetchData(); toast.success('User deleted') }
                        catch (err) { toast.error(err.response?.data?.message || 'Failed') }
                      }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-sm rounded-2xl p-6 fade-in" style={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-5">
                <ShieldPlus size={18} className="text-violet-400" />
                <h3 className="text-white font-semibold">Create Admin Account</h3>
              </div>
              <form onSubmit={createAdmin} className="space-y-3">
                {[
                  { name: 'name',       type: 'text',     placeholder: 'Full name'    },
                  { name: 'email',      type: 'email',    placeholder: 'Email address'},
                  { name: 'password',   type: 'password', placeholder: 'Password'     },
                  { name: 'department', type: 'text',     placeholder: 'Department (optional)' },
                ].map(({ name, type, placeholder }) => (
                  <input key={name} name={name} type={type} placeholder={placeholder}
                    value={adminForm[name]} onChange={e => setAdminForm({ ...adminForm, [name]: e.target.value })}
                    required={name !== 'department'}
                    className={inputCls} />
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-xl text-slate-400 text-sm border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating}
                    className="flex-1 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {drawerReport && <ReportDrawer report={drawerReport} onClose={() => setDrawerReport(null)} />}
    </div>
  )
}