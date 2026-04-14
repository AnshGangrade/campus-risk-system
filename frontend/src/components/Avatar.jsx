const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const colors = [
  'bg-violet-700', 'bg-indigo-700', 'bg-blue-700',
  'bg-teal-700',   'bg-emerald-700','bg-rose-700',
]

function getColor(name = '') {
  const i = name.charCodeAt(0) % colors.length
  return colors[i]
}

export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const sz    = sizes[size] || sizes.md
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  if (user?.avatar) {
    const src = user.avatar.startsWith('http') ? user.avatar : `${API_BASE}${user.avatar}`
    return (
      <img
        src={src}
        alt={user.name}
        className={`${sz} rounded-full object-cover border border-white/10 flex-shrink-0 ${className}`}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }

  return (
    <div className={`${sz} ${getColor(user?.name)} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 border border-white/10 ${className}`}>
      {initials}
    </div>
  )
}