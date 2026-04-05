import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import API from '../api'
import Navbar from '../components/Navbar'

export default function CrowdMonitor() {
  const mapRef     = useRef(null)
  const leafletRef = useRef(null)
  const [reports,  setReports]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [stats,    setStats]    = useState({ total: 0, crowded: 0, critical: 0 })

  useEffect(() => {
    fetchAndRender()
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null } }
  }, [])

  const fetchAndRender = async () => {
    try {
      const { data } = await API.get('/reports')
      setReports(data)
      setStats({
        total:    data.length,
        crowded:  data.filter(r => r.category === 'overcrowding').length,
        critical: data.filter(r => r.severity === 'critical').length,
      })
      renderMap(data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const renderMap = async (data) => {
    if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }
    const L = await import('leaflet')

    const map = L.map(mapRef.current).setView([18.5204, 73.8567], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)
    leafletRef.current = map

    const severityWeight = { low: 0.3, medium: 0.5, high: 0.8, critical: 1.0 }

    try {
      const HeatModule = await import('leaflet.heat')
      const heatPoints = data
        .filter(r => r.latitude && r.longitude)
        .map(r => [r.latitude, r.longitude, severityWeight[r.severity] || 0.5])

      if (heatPoints.length > 0) {
        L.heatLayer(heatPoints, {
          radius: 35, blur: 25, maxZoom: 17,
          gradient: { 0.2: '#22c55e', 0.4: '#f59e0b', 0.7: '#f97316', 1.0: '#ef4444' }
        }).addTo(map)
      }
    } catch {
      console.log('Heatmap plugin not loaded, showing markers only')
    }

    data.forEach(r => {
      if (!r.latitude || !r.longitude) return
      const colors = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }
      const color  = colors[r.severity] || '#6366f1'
      const icons  = { infrastructure:'🏗️', electrical:'⚡', water:'💧', overcrowding:'👥', safety:'🛡️', other:'📋' }

      const icon = L.divIcon({
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 12px ${color}88">${icons[r.category]||'📋'}</div>`,
        className: '', iconAnchor: [14, 14]
      })

      L.marker([r.latitude, r.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="background:#111827;color:#f1f5f9;padding:10px;border-radius:10px;min-width:180px;border:1px solid #1f2937">
            <p style="font-weight:600;margin-bottom:4px">${r.title}</p>
            <p style="color:#94a3b8;font-size:12px;margin-bottom:6px">${r.location}</p>
            <span style="background:${color}33;color:${color};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:500">${r.severity}</span>
            <span style="background:#6366f133;color:#818cf8;padding:2px 8px;border-radius:20px;font-size:11px;margin-left:4px">${r.status}</span>
          </div>
        `, { className: 'custom-popup' })
    })
  }

  const crowdedReports = reports.filter(r => r.category === 'overcrowding')
  const criticalReports = reports.filter(r => r.severity === 'critical')

  return (
    <div className="min-h-screen bg-[#0b1120]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">👥 Crowd Monitor</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time campus heatmap and risk visualization</p>
          </div>
          <button onClick={fetchAndRender}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm transition-colors">
            🔄 Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Reports', value: stats.total,    color: 'text-indigo-400', bg: 'bg-indigo-900/20', icon: '📋' },
            { label: 'Crowded Areas', value: stats.crowded,  color: 'text-yellow-400', bg: 'bg-yellow-900/20', icon: '👥' },
            { label: 'Critical',      value: stats.critical, color: 'text-red-400',    bg: 'bg-red-900/20',    icon: '🚨' },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 border border-slate-700/50`}>
              <p className="text-slate-400 text-xs mb-1">{icon} {label}</p>
              <p className={`text-3xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-[#1f2937] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1f2937] flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">🗺️ Campus Risk Heatmap</p>
                <p className="text-slate-500 text-xs">Click markers to view report details</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {[['#22c55e','Low'],['#f59e0b','Medium'],['#f97316','High'],['#ef4444','Critical']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }}></span>{l}
                  </span>
                ))}
              </div>
            </div>
            {loading
              ? <div className="flex items-center justify-center h-96 text-slate-400">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm">Loading map...</p>
                  </div>
                </div>
              : <div ref={mapRef} style={{ height: '480px', width: '100%' }}></div>
            }
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            <div className="bg-[#111827] rounded-2xl border border-[#1f2937] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1f2937]">
                <p className="text-white text-sm font-medium">👥 Overcrowded Areas ({crowdedReports.length})</p>
              </div>
              <div className="divide-y divide-[#1f2937] max-h-56 overflow-y-auto">
                {crowdedReports.length === 0
                  ? <div className="px-4 py-6 text-center text-slate-500 text-sm">No overcrowding reports</div>
                  : crowdedReports.map(r => (
                    <div key={r._id} className="px-4 py-3 hover:bg-slate-800/30 transition-colors">
                      <p className="text-white text-sm font-medium truncate">{r.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{r.location}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.severity === 'critical' ? 'bg-red-900/40 text-red-400' :
                          r.severity === 'high'     ? 'bg-orange-900/40 text-orange-400' :
                          'bg-yellow-900/40 text-yellow-400'
                        }`}>{r.severity}</span>
                        <span className="text-slate-600 text-xs">↑ {r.upvoteCount}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="bg-[#111827] rounded-2xl border border-[#1f2937] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1f2937]">
                <p className="text-white text-sm font-medium">🚨 Critical Alerts ({criticalReports.length})</p>
              </div>
              <div className="divide-y divide-[#1f2937] max-h-56 overflow-y-auto">
                {criticalReports.length === 0
                  ? <div className="px-4 py-6 text-center text-slate-500 text-sm">No critical reports</div>
                  : criticalReports.map(r => (
                    <div key={r._id} className="px-4 py-3 hover:bg-slate-800/30 transition-colors">
                      <p className="text-white text-sm font-medium truncate">{r.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{r.location} · {r.category}</p>
                      <span className={`text-xs mt-1.5 inline-block px-2 py-0.5 rounded-full ${
                        r.status === 'resolved'    ? 'bg-green-900/40 text-green-400' :
                        r.status === 'in-progress' ? 'bg-blue-900/40 text-blue-400' :
                        'bg-yellow-900/40 text-yellow-400'
                      }`}>{r.status}</span>
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