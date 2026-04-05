import { useEffect, useRef } from 'react'

const severityColor = {
  low:      { bg: 'bg-green-900/40',  text: 'text-green-400',  dot: 'bg-green-400'  },
  medium:   { bg: 'bg-yellow-900/40', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  high:     { bg: 'bg-orange-900/40', text: 'text-orange-400', dot: 'bg-orange-400' },
  critical: { bg: 'bg-red-900/40',    text: 'text-red-400',    dot: 'bg-red-400'    },
}
const statusColor = {
  pending:       { bg: 'bg-yellow-900/40', text: 'text-yellow-400' },
  'in-progress': { bg: 'bg-blue-900/40',   text: 'text-blue-400'   },
  resolved:      { bg: 'bg-green-900/40',  text: 'text-green-400'  },
}
const categoryIcons = {
  infrastructure: '🏗️', electrical: '⚡', water: '💧',
  overcrowding: '👥', safety: '🛡️', other: '📋'
}

const etaHours = { '1 hour': 1, '4 hours': 4, '8 hours': 8, '1 day': 24, '2 days': 48, '3 days': 72 }

function isOverdue(report) {
  if (!report.eta || !report.etaSetAt || report.status === 'resolved') return false
  const hoursElapsed = (Date.now() - new Date(report.etaSetAt)) / 3600000
  return hoursElapsed > (etaHours[report.eta] || 0)
}

export default function ReportDrawer({ report, onClose }) {
  const drawerRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!report) return null

  const overdue = isOverdue(report)
  const sev = severityColor[report.severity] || severityColor.medium
  const sta = statusColor[report.status]     || statusColor.pending

  const timelineSteps = [
    { key: 'pending',     label: 'Reported',     desc: 'Issue submitted',     date: report.createdAt },
    { key: 'in-progress', label: 'In Progress',  desc: 'Team assigned',       date: null },
    { key: 'resolved',    label: 'Resolved',      desc: 'Issue fixed',        date: null },
  ]
  const stepIndex = { pending: 0, 'in-progress': 1, resolved: 2 }
  const currentStep = stepIndex[report.status] ?? 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-[440px] z-50 flex flex-col"
        style={{
          background: '#0d1523',
          borderLeft: '1px solid #1f2937',
          animation: 'slideIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryIcons[report.category] || '📋'}</span>
            <div>
              <p className="text-white font-semibold text-sm leading-tight line-clamp-1">{report.title}</p>
              <p className="text-slate-500 text-xs mt-0.5">Report Details</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-lg">
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Image */}
          {report.image && (
            <div className="rounded-2xl overflow-hidden border border-[#1f2937]">
              <img
                src={`http://localhost:5000${report.image}`}
                alt="report"
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${sev.bg} ${sev.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`}></span>
              {report.severity}
            </span>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize ${sta.bg} ${sta.text}`}>
              {report.status}
            </span>
            {report.assignedDepartment && report.assignedDepartment !== 'Unassigned' && (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-indigo-900/30 text-indigo-400 border border-indigo-800/40">
                {report.assignedDepartment}
              </span>
            )}
            {report.eta && (
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${overdue ? 'bg-red-900/40 text-red-400 border border-red-800/40' : 'bg-slate-800 text-slate-300'}`}>
                {overdue ? 'Overdue' : `ETA: ${report.eta}`}
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] overflow-hidden">
            {[
              { label: 'Location',   value: report.location },
              { label: 'Category',   value: report.category },
              { label: 'Reporter',   value: report.reportedBy?.name || 'Unknown' },
              { label: 'Department', value: report.assignedDepartment || 'Unassigned' },
              { label: 'Submitted',  value: new Date(report.createdAt).toLocaleString() },
              { label: 'Upvotes',    value: `${report.upvoteCount} votes` },
            ].map(({ label, value }, i) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 ${i !== 5 ? 'border-b border-[#1f2937]' : ''}`}>
                <span className="text-slate-500 text-xs font-medium">{label}</span>
                <span className="text-slate-200 text-xs text-right max-w-[60%] capitalize">{value}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">Description</p>
            <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
              <p className="text-slate-300 text-sm leading-relaxed">{report.description}</p>
            </div>
          </div>

          {/* Mini map */}
          {report.latitude && report.longitude && (
            <div>
              <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">Location on Map</p>
              <div className="rounded-2xl overflow-hidden border border-[#1f2937]" style={{ height: 180 }}>
                <MiniMap lat={report.latitude} lng={report.longitude} title={report.title} />
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-slate-400 text-xs font-medium mb-4 uppercase tracking-wider">Timeline</p>
            <div className="relative">
              {timelineSteps.map((step, i) => {
                const done    = i <= currentStep
                const current = i === currentStep
                return (
                  <div key={step.key} className="flex items-start gap-4 mb-5 last:mb-0">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        done
                          ? current
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-green-600 border-green-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-600'
                      }`}>
                        {done && !current ? '✓' : i + 1}
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 ${i < currentStep ? 'bg-green-600' : 'bg-slate-700'}`}></div>
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${done ? 'text-white' : 'text-slate-600'}`}>{step.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{step.desc}</p>
                      {step.date && done && (
                        <p className="text-slate-600 text-xs mt-0.5">{new Date(step.date).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function MiniMap({ lat, lng, title }) {
  const ref = useRef(null)
  useEffect(() => {
    let map
    import('leaflet').then(L => {
      map = L.map(ref.current, { zoomControl: false, dragging: false, scrollWheelZoom: false })
        .setView([lat, lng], 17)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      const icon = L.divIcon({
        html: '<div style="background:#6366f1;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(99,102,241,0.8)"></div>',
        className: '', iconAnchor: [8, 8]
      })
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(title)
    })
    return () => { if (map) map.remove() }
  }, [lat, lng, title])
  return <div ref={ref} style={{ height: '100%', width: '100%' }} />
}