const express = require('express')
const router  = express.Router()
const jwt     = require('jsonwebtoken')
const Report  = require('../models/Report')
const User    = require('../models/User')
const { adminOnly, superAdminOnly } = require('../middleware/auth')

router.get('/stats', adminOnly, async (req, res) => {
  try {
    const total      = await Report.countDocuments()
    const pending    = await Report.countDocuments({ status: 'pending' })
    const inProgress = await Report.countDocuments({ status: 'in-progress' })
    const resolved   = await Report.countDocuments({ status: 'resolved' })
    const critical   = await Report.countDocuments({ severity: 'critical' })
    const users      = await User.countDocuments({ role: 'USER' })
    const byCategory = await Report.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
    const bySeverity = await Report.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }])
    res.json({ total, pending, inProgress, resolved, critical, users, byCategory, bySeverity })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/reports', adminOnly, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reportedBy', 'name email avatar role')
      .sort({ createdAt: -1 })
    res.json(reports)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/create-admin', superAdminOnly, async (req, res) => {
  try {
    const { name, email, password, department } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password required' })
    }
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Email already registered' })
    const user = await User.create({ name, email, password, role: 'ADMIN', department })
    res.status(201).json({
      message: 'Admin created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }) }
})

router.delete('/users/:id', superAdminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'SUPER_ADMIN') return res.status(403).json({ message: 'Cannot delete super admin' })
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'User deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router