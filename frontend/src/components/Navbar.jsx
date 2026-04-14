import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, FileWarning, Map, Bell, LogOut,
  ChevronDown, Shield, ShieldAlert, User as UserIcon
} from 'lucide-react'
import mit from '../assets/mit.avif'
import NotificationBell from './NotificationBell'
import Avatar from './Avatar'
import { roleBadge } from './Badge'

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
    { path: '/',      label: 'Reports',  Icon: FileWarning },
    { path: '/crowd', label: 'Monitor',  Icon: Map },
    ...(['ADMIN','SUPER_ADMIN'].includes(user.role)
      ? [{ path: '/admin', label: 'Dashboard', Icon: LayoutDashboard }] : []),
  ]

  const RoleIcon = user.role === 'SUPER_ADMIN' ? ShieldAlert : user.role === 'ADMIN' ? Shield : UserIcon

  return (
    <nav className="bg-[#0b1220] border-b border-white/[0.06] px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
          <img src={mit} alt="campus" className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0" />
          <div className="hidden sm:block">
            <p className="text-white text-sm font-semibold leading-tight tracking-tight">Campus Risk Alert</p>
            <p className="text-slate-500 text-xs">Safety Intelligence System</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ path, label, Icon }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                location.pathname === path
                  ? 'bg-violet-700/20 text-violet-300 border border-violet-700/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/report')}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-medium transition-colors">
            <FileWarning size={15} />
            Report
          </button>

          <NotificationBell
            notifications={notifications}
            onClear={onClearNotifications}
            onOpen={id => onOpenReport?.(id)}
          />

          {/* Profile dropdown */}
          <div className="relative">
            <button onClick={() => setOpen(!open)}
              className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.07] rounded-xl border border-white/[0.06] transition-colors">
              <Avatar user={user} size="sm" />
              <div className="hidden md:block text-left">
                <p className="text-white text-xs font-medium leading-tight">{user.name}</p>
                <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <RoleIcon size={10} />
                  {user.role}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-500 hidden md:block" />
            </button>

            {open && (
              <div className="absolute right-0 top-12 w-56 rounded-xl overflow-hidden z-50 border border-white/[0.06] shadow-2xl"
                style={{ background: '#0b1220' }}>
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <Avatar user={user} size="md" />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{user.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[user.role]}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  {links.map(({ path, label, Icon }) => (
                    <button key={path} onClick={() => { navigate(path); setOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-white/[0.04] text-sm transition-colors">
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-white/[0.06] py-1">
                  <button onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 text-sm transition-colors">
                    <LogOut size={15} />
                    Logout
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