const express = require('express')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { loyaltyAdjustSchema } = require('../schemas/loyalty')
const loyalty = require('../lib/loyalty')

const router = express.Router()

router.get('/balance', authenticateToken, (req, res) => {
  res.json({
    balance: loyalty.getBalance(req.user.id),
    enabled: loyalty.isEnabled(),
    point_value: loyalty.pointValue(),
    points_per_1000: loyalty.pointsPer1000(),
    redeem_min: loyalty.REDEEM_MIN_POINTS
  })
})

router.get('/history', authenticateToken, (req, res) => {
  res.json(loyalty.getHistory(req.user.id))
})

router.post('/adjust', authenticateToken, requireAdmin, validate(loyaltyAdjustSchema), (req, res) => {
  const { user_id, points, reason } = req.body
  const newBalance = loyalty.adjustPoints(user_id, points, reason, req.user.id)
  res.json({ balance: newBalance })
})

module.exports = router
