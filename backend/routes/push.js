const express          = require('express')
const router           = express.Router()
const webpush          = require('web-push')
const jwt              = require('jsonwebtoken')
const PushSubscription = require('../models/PushSubscription')

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@campusrisk.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Not authorized' })
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch { res.status(401).json({ message: 'Invalid token' }) }
}

router.post('/subscribe', protect, async (req, res) => {
  try {
    const { endpoint, keys } = req.body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid subscription data' })
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys, userId: req.user.id },
      { upsert: true, new: true }
    )
    res.json({ message: 'Subscribed successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/unsubscribe', protect, async (req, res) => {
  try {
    await PushSubscription.deleteOne({ endpoint: req.body.endpoint })
    res.json({ message: 'Unsubscribed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

module.exports = router