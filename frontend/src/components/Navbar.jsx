import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import mit from '../assets/mit.avif'
import NotificationBell from './NotificationBell'

export default function Navbar({ notifications = [], onClearNotifications, onOpenReport }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user     = JSON.parse(localStorage.getItem('user') || '{}')
  const [open, setOpen] = useState(false)

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const links = [
    { path: '/',      label: 'Reports',       icon: '📋' },
    { path: '/crowd', label: 'Crowd Monitor', icon: '👥' },
    ...(user.role === 'admin' ? [{ path: '/admin', label: 'Dashboard', icon: '📊' }] : []),
  ]

  return (
    <nav className="bg-[#111827] border-b border-[#1f2937] px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src={mit} alt="campus" className="w-9 h-9 rounded-xl object-cover border border-slate-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-white text-sm leading-tight">Campus Risk Alert</p>
            <p className="text-slate-500 text-xs">Safety Intelligence System</p>
          </div>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ path, label, icon }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                location.pathname === path
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/report')}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
            🚨 Report Issue
          </button>

          {/* Notification Bell */}
          <NotificationBell
            notifications={notifications}
            onClear={onClearNotifications}
            onOpen={(id) => { if (onOpenReport) onOpenReport(id) }}
          />

          {/* Profile */}
          <div className="relative">
            <button onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700">
              <div className="w-6 h-6 bg-indigo-700 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-300 text-sm hidden md:block">{user.name}</span>
              <span className="text-xs text-slate-500 hidden md:block capitalize">({user.role})</span>
            </button>
            {open && (
              <div className="absolute right-0 top-12 bg-[#111827] border border-[#1f2937] rounded-xl shadow-xl w-48 py-1 z-50">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
                  <img src={mit} alt="campus" className="w-8 h-8 rounded-lg object-cover border border-slate-600" />
                  <div>
                    <p className="text-white text-sm font-medium">{user.name}</p>
                    <p className="text-slate-400 text-xs capitalize">{user.role}</p>
                  </div>
                </div>
                {links.map(({ path, label, icon }) => (
                  <button key={path} onClick={() => { navigate(path); setOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 text-sm flex items-center gap-2 transition-colors">
                    {icon} {label}
                  </button>
                ))}
                <div className="border-t border-slate-700 mt-1">
                  <button onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-slate-800 text-sm transition-colors">
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}