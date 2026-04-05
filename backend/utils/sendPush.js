const webpush          = require('web-push')
const PushSubscription = require('../models/PushSubscription')

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@campusrisk.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

async function sendPushToAll(payload) {
  const subscriptions = await PushSubscription.find()
  if (!subscriptions.length) return

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload)
        )
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id })
        }
        throw err
      }
    })
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  console.log(`Push sent: ${sent} success, ${failed} failed`)
}

module.exports = sendPushToAll