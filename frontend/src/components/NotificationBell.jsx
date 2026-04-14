import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck } from 'lucide-react'

const typeIcon = {
  report:   '↑',
  status:   '↺',
  resolved: '✓',
  assigned: '→',
  eta:      '◷',
}

export default function NotificationBell({ notifications, onClear, onOpen }) {
  const [open, setOpen] = useState(false)
  const ref    = useRef(null)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000)
    if (s < 60)    return 'just now'
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl transition-colors">
        <Bell size={16} className="text-slate-400" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-xl overflow-hidden z-50 border border-white/[0.06] shadow-2xl fade-in"
          style={{ background: '#0b1220' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div>
              <p className="text-white text-sm font-semibold">Notifications</p>
              <p className="text-slate-500 text-xs">{unread} unread</p>
            </div>
            {notifications.length > 0 && (
              <button onClick={onClear}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]">
                <CheckCheck size={13} /> Clear
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0
              ? <div className="px-4 py-10 text-center">
                  <Bell size={28} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No notifications</p>
                </div>
              : notifications.map(n => (
                <div key={n.id}
                  onClick={() => { if (n.reportId) { onOpen(n.reportId); setOpen(false) } }}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-colors ${!n.read ? 'bg-violet-950/10' : ''}`}>
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs text-slate-400 flex-shrink-0 font-mono">
                    {typeIcon[n.type] || '·'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-xs font-medium">{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 bg-violet-400 rounded-full flex-shrink-0"></span>}
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