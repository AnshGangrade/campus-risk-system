import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Shield, Mail, Lock, User } from 'lucide-react'
import API from '../api'
import mit from '../assets/mit.avif'

export default function LoginPage() {
  const navigate     = useNavigate()
  const [isLogin, setIsLogin]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', password: '' })
  const containerRef = useRef(null)
  const spotlightRef = useRef(null)
  const parallaxRef  = useRef(null)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e) => {
      const { clientX: x, clientY: y } = e
      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty('--x', `${x}px`)
        spotlightRef.current.style.setProperty('--y', `${y}px`)
      }
      if (parallaxRef.current) {
        const dx = (x - window.innerWidth  / 2) * 0.01
        const dy = (y - window.innerHeight / 2) * 0.01
        parallaxRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`
      }
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const payload  = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }
      const { data } = await API.post(endpoint, payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success(isLogin ? `Welcome back, ${data.user.name}` : 'Account created')
      const role = data.user.role
      navigate(role === 'SUPER_ADMIN' || role === 'ADMIN' ? '/admin' : '/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  const inputClass = "w-full rounded-xl px-4 py-3 pl-10 text-white text-sm placeholder-white/20 focus:outline-none transition-all"
  const inputStyle = {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
  }

  return (
    <div ref={containerRef} className="relative min-h-screen w-full overflow-hidden flex" style={{ background: '#000' }}>

      {/* Grayscale base */}
      <div className="absolute inset-0"
        style={{ backgroundImage: `url(${mit})`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'grayscale(100%) brightness(0.4) contrast(1.1)', transition: 'transform 0.15s ease-out' }}
        ref={parallaxRef} />

      {/* Dark overlay */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.88) 0%, rgba(2,6,23,0.8) 50%, rgba(0,0,0,0.88) 100%)' }} />

      {/* Color spotlight */}
      <div ref={spotlightRef} className="absolute inset-0"
        style={{ backgroundImage: `url(${mit})`, backgroundSize: 'cover', backgroundPosition: 'center',
          WebkitMaskImage: 'radial-gradient(circle at var(--x, 50%) var(--y, 50%), black 0px, black 90px, rgba(0,0,0,0.3) 160px, transparent 220px)',
          maskImage: 'radial-gradient(circle at var(--x, 50%) var(--y, 50%), black 0px, black 90px, rgba(0,0,0,0.3) 160px, transparent 220px)',
          '--x': '50%', '--y': '50%' }} />

      <div className="relative z-10 w-full flex">

        {/* Left panel */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-14">
          <div className="flex items-center gap-3 fade-in">
            <img src={mit} alt="campus" className="w-8 h-8 rounded-lg object-cover border border-white/20" />
            <span className="text-white/70 text-sm tracking-wider">CAMPUS RISK ALERT</span>
          </div>

          <div className="fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-violet-400" />
              <span className="text-violet-400 text-xs tracking-[0.2em] uppercase">Safety Intelligence System</span>
            </div>
            <h1 className="text-6xl font-bold text-white leading-[1.1] mb-6">
              Campus<br />
              <span className="text-violet-400">Risk</span><br />
              Alert
            </h1>
            <div className="w-10 h-0.5 bg-violet-600 mb-8"></div>
            <div className="space-y-3">
              {[
                'Real-time campus hazard reporting',
                'Crowd monitoring and heatmaps',
                'Smart analytics for administrators',
                'Role-based access control',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 fade-in" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                  <div className="w-1 h-1 rounded-full bg-violet-500 flex-shrink-0"></div>
                  <p className="text-white/50 text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/15 text-xs tracking-widest uppercase">
            Intelligent Campus Monitoring System
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 lg:max-w-[420px] flex items-center justify-center px-6 py-12 min-h-screen">
          <div className="w-full max-w-sm">

            <div className="lg:hidden text-center mb-8">
              <img src={mit} alt="campus" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 border border-white/20" />
              <h1 className="text-xl font-bold text-white">Campus Risk Alert</h1>
            </div>

            <div className="rounded-2xl p-8 fade-in"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 0 40px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

              <h2 className="text-lg font-semibold text-white mb-1">
                {isLogin ? 'Sign in' : 'Create account'}
              </h2>
              <p className="text-white/30 text-xs mb-6 tracking-wide">
                {isLogin ? 'Access your campus dashboard' : 'Join the campus safety network'}
              </p>

              <div className="flex p-1 mb-6 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {['Sign In', 'Register'].map((label, i) => (
                  <button key={label} onClick={() => setIsLogin(i === 0)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all"
                    style={{
                      background: isLogin === (i === 0) ? '#7c3aed' : 'transparent',
                      color: isLogin === (i === 0) ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}>{label}</button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-3.5 text-white/25" />
                    <input name="name" value={form.name} onChange={handle} required={!isLogin}
                      placeholder="Full name"
                      className={inputClass} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                      onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  </div>
                )}
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-3.5 text-white/25" />
                  <input name="email" type="email" value={form.email} onChange={handle} required
                    placeholder="Email address"
                    className={inputClass} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-3.5 text-white/25" />
                  <input name="password" type="password" value={form.password} onChange={handle} required
                    placeholder="Password"
                    className={inputClass} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold tracking-wide transition-all disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 28px rgba(124,58,237,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.3)'}>
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Please wait...
                      </span>
                    : isLogin ? 'Sign In' : 'Create Account'
                  }
                </button>
              </form>

              {isLogin && (
                <p className="text-center text-white/20 text-xs mt-4">
                  Contact your administrator for admin access
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}