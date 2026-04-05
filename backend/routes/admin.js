const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Report = require('../models/Report')
const User = require('../models/User')

const adminOnly = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Not authorized' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admins only' })
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}

router.get('/stats', async (req, res) => {
  try {
    const total = await Report.countDocuments()
    const pending = await Report.countDocuments({ status: 'pending' })
    const inProgress = await Report.countDocuments({ status: 'in-progress' })
    const resolved = await Report.countDocuments({ status: 'resolved' })
    const critical = await Report.countDocuments({ severity: 'critical' })
    const users = await User.countDocuments({ role: 'user' })
    const byCategory = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    const bySeverity = await Report.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ])
    res.json({ total, pending, inProgress, resolved, critical, users, byCategory, bySeverity })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
    res.json(reports)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router