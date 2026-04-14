import { useState, useEffect, useRef } from 'react'
import { useNavigate }   from 'react-router-dom'
import toast             from 'react-hot-toast'
import { FileWarning, MapPin, Upload, X } from 'lucide-react'
import API   from '../api'
import Navbar from '../components/Navbar'

export default function ReportPage({ addNotification }) {
  const navigate   = useNavigate()
  const mapRef     = useRef(null)
  const leafletRef = useRef(null)
  const markerRef  = useRef(null)
  const [loading,  setLoading]  = useState(false)
  const [image,    setImage]    = useState(null)
  const [preview,  setPreview]  = useState('')
  const [coords,   setCoords]   = useState({ lat: 18.5204, lng: 73.8567 })
  const [form, setForm] = useState({
    title: '', description: '', category: 'infrastructure',
    severity: 'medium', location: ''
  })

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  useEffect(() => {
    if (leafletRef.current) return
    import('leaflet').then(L => {
      const map = L.map(mapRef.current).setView([18.5204, 73.8567], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

      const mkIcon = () => L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#7c3aed;border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 10px rgba(124,58,237,0.7)"></div>`,
        className: '', iconAnchor: [8, 8]
      })

      const marker = L.marker([18.5204, 73.8567], { icon: mkIcon() }).addTo(map)
      markerRef.current = marker

      map.on('click', e => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        setCoords({ lat, lng })
        toast.success('Location pinned')
      })

      leafletRef.current = map
    })
    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }
    }
  }, [])

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('latitude',  coords.lat)
      fd.append('longitude', coords.lng)
      if (image) fd.append('image', image)
      await API.post('/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Report submitted')
      addNotification?.('report', 'Report Submitted', form.title)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit')
    } finally { setLoading(false) }
  }

  const inputCls = "w-full bg-[#020617] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-600/50 transition-colors"

  const severityColors = {
    low: 'text-emerald-400', medium: 'text-yellow-400',
    high: 'text-orange-400', critical: 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <FileWarning size={18} className="text-violet-400" />
            <h1 className="text-xl font-semibold text-white tracking-tight">Submit Report</h1>
          </div>
          <p className="text-slate-500 text-sm">Report a campus hazard or safety concern</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Main fields */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Title</label>
              <input name="title" value={form.title} onChange={handle} required
                placeholder="e.g. Broken railing near Block B"
                className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Category</label>
                <select name="category" value={form.category} onChange={handle} className={inputCls}>
                  {['infrastructure','electrical','water','overcrowding','safety','other'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">
                  Severity — <span className={severityColors[form.severity]}>{form.severity}</span>
                </label>
                <select name="severity" value={form.severity} onChange={handle} className={inputCls}>
                  {['low','medium','high','critical'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Location Name</label>
              <input name="location" value={form.location} onChange={handle} required
                placeholder="e.g. Block A, Ground Floor"
                className={inputCls} />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea name="description" value={form.description} onChange={handle} required rows={3}
                placeholder="Describe the issue in detail..."
                className={`${inputCls} resize-none`} />
            </div>
          </div>

          {/* Map picker */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-violet-400" />
                <div>
                  <p className="text-white text-xs font-medium">Pin Location on Map</p>
                  <p className="text-slate-600 text-xs">Click to select exact location</p>
                </div>
              </div>
              <span className="text-xs text-violet-400 bg-violet-950/30 px-3 py-1 rounded-lg border border-violet-900/30 font-mono">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            </div>
            <div ref={mapRef} style={{ height: 260, width: '100%' }} />
          </div>

          {/* Image upload */}
          <div className="card p-5">
            <label className="block text-xs text-slate-500 mb-3 uppercase tracking-wider">
              Photo Evidence <span className="text-slate-700 normal-case">(optional)</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-white/[0.08] rounded-xl cursor-pointer hover:border-violet-600/40 transition-colors overflow-hidden">
              {preview
                ? <div className="relative w-full h-full">
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    <button type="button"
                      onClick={e => { e.preventDefault(); setPreview(''); setImage(null) }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                      <X size={12} />
                    </button>
                  </div>
                : <div className="text-center">
                    <Upload size={20} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-600 text-xs">Click to upload image</p>
                    <p className="text-slate-700 text-xs mt-0.5">PNG, JPG up to 10MB</p>
                  </div>
              }
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-xl text-slate-400 text-sm border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Submitting...
                  </span>
                : 'Submit Report'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}