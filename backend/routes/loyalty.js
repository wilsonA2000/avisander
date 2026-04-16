const express = require('express')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const loyalty = require('../lib/loyalty')

const router = express.Router()

router.get('/balance', authenticateToken, (req, res) => {
  res.json({
    balance: loyalty.getBalance(req.user.id),
    enabled: loyalty.isEnabled(),
    point_value: loyalty.pointValue(),
    points_per_1000: loyalty.pointsPer1000()
  })
})

router.get('/history', authenticateToken, (req, res) => {
  res.json(loyalty.getHistory(req.user.id))
})

router.post('/adjust', authenticateToken, requireAdmin, (req, res) => {
  const { user_id, points, reason } = req.body
  if (!user_id || !points || !reason) {
    return res.status(400).json({ error: 'user_id, points y reason requeridos' })
  }
  const newBalance = loyalty.adjustPoints(user_id, points, reason, req.user.id)
  res.json({ balance: newBalance })
})

module.exports = router
