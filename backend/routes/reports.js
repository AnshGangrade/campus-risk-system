const express  = require('express')
const router   = express.Router()
const jwt      = require('jsonwebtoken')
const multer   = require('multer')
const path     = require('path')
const Report   = require('../models/Report')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})
const upload = multer({ storage })

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Not authorized' })
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch { res.status(401).json({ message: 'Invalid token' }) }
}

router.get('/', async (req, res) => {
  try {
    const { category, status, severity } = req.query
    const filter = {}
    if (category) filter.category = category
    if (status)   filter.status   = status
    if (severity) filter.severity = severity
    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ upvoteCount: -1, createdAt: -1 })
    res.json(reports)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, severity, location, latitude, longitude } = req.body
    const image = req.file ? `/uploads/${req.file.filename}` : ''
    const report = await Report.create({
      title, description, category, severity, location, image,
      latitude:  parseFloat(latitude)  || 18.5204,
      longitude: parseFloat(longitude) || 73.8567,
      reportedBy: req.user.id
    })
    await report.populate('reportedBy', 'name email')
    res.status(201).json(report)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id/upvote', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found' })
    const already = report.upvotes.includes(req.user.id)
    if (already) {
      report.upvotes = report.upvotes.filter(u => u.toString() !== req.user.id)
    } else {
      report.upvotes.push(req.user.id)
    }
    report.upvoteCount = report.upvotes.length
    await report.save()
    res.json({ upvoteCount: report.upvoteCount, upvoted: !already })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id/status', protect, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    ).populate('reportedBy', 'name email')
    res.json(report)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id/assign', protect, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { assignedDepartment: req.body.assignedDepartment },
      { new: true }
    ).populate('reportedBy', 'name email')
    res.json(report)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id/eta', protect, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { eta: req.body.eta, etaSetAt: new Date() },
      { new: true }
    ).populate('reportedBy', 'name email')
    res.json(report)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router