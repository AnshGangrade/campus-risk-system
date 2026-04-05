import { useState, useEffect, useRef } from 'react'

export default function NotificationBell({ notifications, onClear, onOpen }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const typeIcon = { report: '🚨', status: '🔄', resolved: '✅', assigned: '🏢', eta: '⏱️' }
  const typeBg   = { report: 'bg-red-900/30', status: 'bg-blue-900/30', resolved: 'bg-green-900/30', assigned: 'bg-indigo-900/30', eta: 'bg-yellow-900/30' }

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000)
    if (s < 60)   return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-10 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
          style={{
            background: '#0d1523',
            border: '1px solid #1f2937',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2937]">
            <div>
              <p className="text-white text-sm font-semibold">Notifications</p>
              <p className="text-slate-500 text-xs">{unread} unread</p>
            </div>
            {notifications.length > 0 && (
              <button onClick={onClear}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-900/20">
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0
              ? <div className="px-4 py-8 text-center">
                  <p className="text-3xl mb-2">🔕</p>
                  <p className="text-slate-500 text-sm">No notifications yet</p>
                </div>
              : notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (n.reportId) onOpen(n.reportId); setOpen(false) }}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[#1f2937] cursor-pointer hover:bg-slate-800/40 transition-colors ${!n.read ? 'bg-slate-800/20' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${typeBg[n.type] || 'bg-slate-800'}`}>
                    {typeIcon[n.type] || '📢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-xs font-medium">{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0"></span>}
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-slate-600 text-xs mt-1">{timeAgo(n.time)}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}