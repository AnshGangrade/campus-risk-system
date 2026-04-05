import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../api'
import mit from '../assets/mit.avif'

export default function LoginPage() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })
  const containerRef = useRef(null)
  const spotlightRef = useRef(null)
  const parallaxRef  = useRef(null)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onMove = (e) => {
      const { clientX: x, clientY: y } = e
      const { innerWidth: w, innerHeight: h } = window

      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty('--x', `${x}px`)
        spotlightRef.current.style.setProperty('--y', `${y}px`)
      }

      if (parallaxRef.current) {
        const dx = (x - w / 2) * 0.012
        const dy = (y - h / 2) * 0.012
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
        : { name: form.name, email: form.email, password: form.password, role: form.role }
      const { data } = await API.post(endpoint, payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success(isLogin ? `Welcome back, ${data.user.name}!` : 'Account created!')
      navigate(data.user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
      style={{ background: '#000' }}
    >
      {/* Layer 1 — grayscale base image */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${mit})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) brightness(0.45) contrast(1.1)',
          transition: 'transform 0.15s ease-out',
        }}
        ref={parallaxRef}
      />

      {/* Layer 2 — dark gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(11,17,32,0.75) 50%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Layer 3 — cursor spotlight (colored reveal) */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${mit})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          WebkitMaskImage: 'radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(0,0,0,1) 0px, rgba(0,0,0,1) 100px, rgba(0,0,0,0.35) 170px, transparent 230px)',
          maskImage: 'radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(0,0,0,1) 0px, rgba(0,0,0,1) 100px, rgba(0,0,0,0.35) 170px, transparent 230px)',
          '--x': '50%',
          '--y': '50%',
          transition: 'transform 0.15s ease-out',
        }}
      />

      {/* Main layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto min-h-screen flex">

        {/* Left panel — text */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-14">
          {/* Brand */}
          <div className="fade-in flex items-center gap-3">
            <img src={mit} alt="campus" className="w-9 h-9 rounded-xl object-cover border border-white/20" />
            <span className="text-white/80 font-medium text-sm tracking-wide">Campus Risk Alert</span>
          </div>

          {/* Hero text */}
          <div className="fade-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-white/40 text-sm font-medium tracking-[0.2em] uppercase mb-4">
              Safety Intelligence System
            </p>
            <h1 className="text-6xl font-bold text-white leading-[1.1] mb-6">
              Campus<br />
              <span style={{ color: '#818cf8' }}>Risk</span><br />
              Alert
            </h1>
            <div className="w-12 h-0.5 bg-indigo-500 mb-6"></div>
            <div className="space-y-3 max-w-xs">
              {[
                'Real-time campus hazard reporting',
                'Crowd monitoring heatmaps',
                'Smart analytics for administrators',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 fade-in" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></div>
                  <p className="text-white/60 text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/20 text-xs tracking-widest uppercase fade-in">
            Intelligent Campus Monitoring
          </p>
        </div>

        {/* Right panel — glass login card */}
        <div className="flex-1 lg:max-w-[440px] flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">

            {/* Mobile brand */}
            <div className="lg:hidden text-center mb-8 fade-in">
              <img src={mit} alt="campus" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 border border-white/20" />
              <h1 className="text-2xl font-bold text-white">Campus Risk Alert</h1>
              <p className="text-white/40 text-sm mt-1">Safety Intelligence System</p>
            </div>

            {/* Glass card */}
            <div
              className="rounded-3xl p-8 fade-in"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 0 40px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <h2 className="text-xl font-semibold text-white mb-1">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-white/40 text-sm mb-6">
                {isLogin ? 'Sign in to your campus account' : 'Join the campus safety network'}
              </p>

              {/* Toggle */}
              <div
                className="flex p-1 mb-6 rounded-xl"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {['Login', 'Register'].map((label, i) => (
                  <button
                    key={label}
                    onClick={() => setIsLogin(i === 0)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: isLogin === (i === 0) ? '#4f46e5' : 'transparent',
                      color: isLogin === (i === 0) ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}
                  >{label}</button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5 font-medium tracking-wide">Full Name</label>
                    <input
                      name="name" value={form.name} onChange={handle} required={!isLogin}
                      placeholder="Your full name"
                      className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-colors"
                      style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                      onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 font-medium tracking-wide">Email Address</label>
                  <input
                    name="email" type="email" value={form.email} onChange={handle} required
                    placeholder="you@campus.edu"
                    className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-colors"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 font-medium tracking-wide">Password</label>
                  <input
                    name="password" type="password" value={form.password} onChange={handle} required
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-colors"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>
                {!isLogin && (
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5 font-medium tracking-wide">Role</label>
                    <select
                      name="role" value={form.role} onChange={handle}
                      className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <option value="user">Student / Staff</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                )}
                <button
                  type="submit" disabled={loading}
                  className="w-full text-white font-medium py-3 rounded-xl transition-all mt-2 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 32px rgba(99,102,241,0.55)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.35)'}
                >
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Please wait...
                      </span>
                    : isLogin ? 'Sign In' : 'Create Account'
                  }
                </button>
              </form>
            </div>

            <p className="text-center text-white/15 text-xs mt-6 tracking-widest uppercase">
              Campus Risk Alert System
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}