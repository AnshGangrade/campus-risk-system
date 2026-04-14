import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Map, RefreshCw, AlertTriangle, Users, Activity } from 'lucide-react'
import API   from '../api'
import Navbar from '../components/Navbar'
import Badge, { severityBadge, statusBadge } from '../components/Badge'

export default function CrowdMonitor({ notifications, onClearNotifications, onOpenReport }) {
  const mapRef     = useRef(null)
  const leafletRef = useRef(null)
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [stats,   setStats]     = useState({ total: 0, crowded: 0, critical: 0 })

  useEffect(() => {
    fetchAndRender()
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null } }
  }, [])

  const fetchAndRender = async () => {
    setLoading(true)
    try {
      const { data } = await API.get('/reports')
      setReports(data)
      setStats({
        total:    data.length,
        crowded:  data.filter(r => r.category === 'overcrowding').length,
        critical: data.filter(r => r.severity === 'critical').length,
      })
      renderMap(data)
    } catch { toast.error('Failed to load') }
    finally  { setLoading(false) }
  }

  const renderMap = async (data) => {
    if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }
    const L = await import('leaflet')

    const map = L.map(mapRef.current).setView([18.5204, 73.8567], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)
    leafletRef.current = map

    // Heatmap
    try {
      await import('leaflet.heat')
      const severityWeight = { low: 0.3, medium: 0.5, high: 0.8, critical: 1.0 }
      const heatPoints = data
        .filter(r => r.latitude && r.longitude)
        .map(r => [r.latitude, r.longitude, severityWeight[r.severity] || 0.5])
      if (heatPoints.length > 0) {
        L.heatLayer(heatPoints, {
          radius: 35, blur: 25, maxZoom: 17,
          gradient: { 0.2: '#10b981', 0.4: '#f59e0b', 0.7: '#f97316', 1.0: '#ef4444' }
        }).addTo(map)
      }
    } catch { /* heatmap plugin optional */ }

    // Markers — no emojis, colored dots with pulse for critical
    const dotColors = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

    data.forEach(r => {
      if (!r.latitude || !r.longitude) return
      const color   = dotColors[r.severity] || '#7c3aed'
      const isCrit  = r.severity === 'critical'

      const iconHtml = isCrit
        ? `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center">
             <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};animation:pulse-ring 1.5s ease-out infinite;opacity:0.6"></div>
             <div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 8px ${color}88"></div>
           </div>`
        : `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.7);box-shadow:0 0 6px ${color}66"></div>`

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconAnchor: [7, 7],
      })

      L.marker([r.latitude, r.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="background:#0b1220;color:#f1f5f9;padding:10px 12px;border-radius:10px;min-width:180px;border:1px solid rgba(255,255,255,0.08);font-family:'JetBrains Mono',monospace;font-size:12px">
            <p style="font-weight:600;margin:0 0 4px">${r.title}</p>
            <p style="color:#64748b;margin:0 0 6px;font-size:11px">${r.location}</p>
            <div style="display:flex;gap:6px">
              <span style="background:${color}22;color:${color};padding:2px 8px;border-radius:20px;font-size:10px;border:1px solid ${color}44">${r.severity}</span>
              <span style="background:rgba(124,58,237,0.15);color:#a78bfa;padding:2px 8px;border-radius:20px;font-size:10px">${r.status}</span>
            </div>
          </div>
        `, { className: 'leaflet-dark-popup' })
    })
  }

  const crowdedReports  = reports.filter(r => r.category === 'overcrowding')
  const criticalReports = reports.filter(r => r.severity === 'critical')

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar
        notifications={notifications}
        onClearNotifications={onClearNotifications}
        onOpenReport={onOpenReport}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Map size={18} className="text-violet-400" />
              <h1 className="text-xl font-semibold text-white tracking-tight">Crowd Monitor</h1>
            </div>
            <p className="text-slate-500 text-sm">Real-time campus risk heatmap</p>
          </div>
          <button onClick={fetchAndRender}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300 rounded-xl text-sm transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Reports', value: stats.total,    Icon: Activity,       color: 'text-violet-400', bg: 'border-violet-900/30' },
            { label: 'Crowded Areas', value: stats.crowded,  Icon: Users,          color: 'text-yellow-400', bg: 'border-yellow-900/30' },
            { label: 'Critical',      value: stats.critical, Icon: AlertTriangle,  color: 'text-red-400',    bg: 'border-red-900/30'    },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} className={`card p-4 border ${bg}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-xs">{label}</p>
                <Icon size={13} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Map */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Campus Risk Heatmap</p>
                <p className="text-slate-500 text-xs">Click markers to view details</p>
              </div>
              <div className="flex items-center gap-3">
                {[
                  { color: '#10b981', label: 'Low'      },
                  { color: '#f59e0b', label: 'Medium'   },
                  { color: '#f97316', label: 'High'     },
                  { color: '#ef4444', label: 'Critical' },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }}></span>
                    {label}
                  </span>
                ))}
              </div>
            </div>
            {loading
              ? <div className="flex items-center justify-center h-96">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              : <div ref={mapRef} style={{ height: 480, width: '100%' }} />
            }
          </div>

          {/* Side panels */}
          <div className="space-y-4">
            {/* Crowded */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <Users size={13} className="text-yellow-400" />
                <p className="text-white text-xs font-medium">
                  Overcrowded <span className="text-slate-500">({crowdedReports.length})</span>
                </p>
              </div>
              <div className="divide-y divide-white/[0.04] max-h-52 overflow-y-auto">
                {crowdedReports.length === 0
                  ? <div className="px-4 py-6 text-center text-slate-600 text-xs">No overcrowding reports</div>
                  : crowdedReports.map(r => (
                    <div key={r._id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <p className="text-white text-xs font-medium truncate">{r.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{r.location}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge label={r.severity} variant={severityBadge[r.severity]} />
                        <span className="text-slate-600 text-xs">↑ {r.upvoteCount}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Critical */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <AlertTriangle size={13} className="text-red-400" />
                <p className="text-white text-xs font-medium">
                  Critical Alerts <span className="text-slate-500">({criticalReports.length})</span>
                </p>
              </div>
              <div className="divide-y divide-white/[0.04] max-h-52 overflow-y-auto">
                {criticalReports.length === 0
                  ? <div className="px-4 py-6 text-center text-slate-600 text-xs">No critical reports</div>
                  : criticalReports.map(r => (
                    <div key={r._id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <p className="text-white text-xs font-medium truncate">{r.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{r.location}</p>
                      <Badge label={r.status} variant={statusBadge[r.status]} className="mt-1.5" />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}