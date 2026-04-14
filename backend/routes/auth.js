const express = require('express')
const router  = express.Router()
const jwt     = require('jsonwebtoken')
const multer  = require('multer')
const path    = require('path')
const User    = require('../models/User')
const { protect } = require('../middleware/auth')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, 'avatar-' + Date.now() + path.extname(file.originalname))
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Email already registered' })
    const user  = await User.create({ name, email, password, role: 'USER' })
    const token = generateToken(user)
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    })
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }) }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Invalid email or password' })
    const match = await user.comparePassword(password)
    if (!match) return res.status(400).json({ message: 'Invalid email or password' })
    const token = generateToken(user)
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    })
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }) }
})

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (err) { res.status(401).json({ message: 'Invalid token' }) }
})

router.put('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : ''
    const user = await User.findByIdAndUpdate(
      req.user.id, { avatar: avatarUrl }, { new: true }
    ).select('-password')
    res.json({ avatar: user.avatar })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router