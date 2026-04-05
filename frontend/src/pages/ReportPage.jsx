import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../api'
import Navbar from '../components/Navbar'

export default function ReportPage() {
  const navigate  = useNavigate()
  const mapRef    = useRef(null)
  const leafletRef = useRef(null)
  const markerRef  = useRef(null)
  const [loading, setLoading] = useState(false)
  const [image,   setImage]   = useState(null)
  const [preview, setPreview] = useState('')
  const [coords,  setCoords]  = useState({ lat: 18.5204, lng: 73.8567 })
  const [form, setForm] = useState({
    title: '', description: '', category: 'infrastructure',
    severity: 'medium', location: ''
  })

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  useEffect(() => {
    if (leafletRef.current) return
    import('leaflet').then(L => {
      const map = L.map(mapRef.current).setView([18.5204, 73.8567], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      const icon = L.divIcon({
        html: '<div style="background:#6366f1;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(99,102,241,0.8)"></div>',
        className: '', iconAnchor: [10, 10]
      })

      let marker = L.marker([18.5204, 73.8567], { icon }).addTo(map)
      markerRef.current = marker

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        setCoords({ lat, lng })
        toast.success('Location selected!')
      })
      leafletRef.current = map
    })
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null } }
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
      toast.success('Report submitted successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  const severityColors = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-orange-400', critical: 'text-red-400' }

  return (
    <div className="min-h-screen bg-[#0b1120]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">🚨 Submit a Report</h1>
          <p className="text-slate-400 text-sm mt-1">Report a campus hazard or safety concern</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="bg-[#111827] rounded-2xl p-6 border border-[#1f2937] space-y-5">

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Title</label>
              <input name="title" value={form.title} onChange={handle} required
                placeholder="e.g. Broken staircase railing near Block B"
                className="w-full bg-[#0b1120] border border-[#1f2937] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Category</label>
                <select name="category" value={form.category} onChange={handle}
                  className="w-full bg-[#0b1120] border border-[#1f2937] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500">
                  {[['infrastructure','🏗️ Infrastructure'],['electrical','⚡ Electrical'],['water','💧 Water'],
                    ['overcrowding','👥 Overcrowding'],['safety','🛡️ Safety'],['other','📋 Other']
                  ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Severity — <span className={severityColors[form.severity]}>{form.severity}</span>
                </label>
                <select name="severity" value={form.severity} onChange={handle}
                  className="w-full bg-[#0b1120] border border-[#1f2937] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Location Name</label>
              <input name="location" value={form.location} onChange={handle} required
                placeholder="e.g. Block A, Ground Floor, Near Cafeteria"
                className="w-full bg-[#0b1120] border border-[#1f2937] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Description</label>
              <textarea name="description" value={form.description} onChange={handle} required rows={3}
                placeholder="Describe the issue in detail..."
                className="w-full bg-[#0b1120] border border-[#1f2937] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
            </div>
          </div>

          {/* Map Picker */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1f2937] flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">📍 Select Location on Map</p>
                <p className="text-slate-500 text-xs">Click anywhere on the map to pin the exact location</p>
              </div>
              <div className="text-xs text-indigo-400 bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-800">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </div>
            </div>
            <div ref={mapRef} style={{ height: '280px', width: '100%' }}></div>
          </div>

          {/* Image Upload */}
          <div className="bg-[#111827] rounded-2xl p-5 border border-[#1f2937]">
            <label className="block text-xs text-slate-400 mb-3 font-medium">📸 Photo Evidence (optional)</label>
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden">
              {preview
                ? <img src={preview} alt="preview" className="h-full w-full object-cover" />
                : <div className="text-center">
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-slate-500 text-sm">Click to upload image</p>
                    <p className="text-slate-600 text-xs mt-1">PNG, JPG up to 10MB</p>
                  </div>
              }
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/')}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition-colors border border-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all hover:scale-[1.01]">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Submitting...</span>
                : '🚨 Submit Report'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}