const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const dotenv   = require('dotenv')
const path     = require('path')

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }))
app.get('/',       (req, res) => res.json({ message: 'Campus Risk Alert API' }))

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message))

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected — retrying...'))
mongoose.connection.on('reconnected',  () => console.log('MongoDB reconnected'))

app.use('/api/auth',    require('./routes/auth'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/admin',   require('./routes/admin'))
app.use('/api/push',    require('./routes/push'))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))