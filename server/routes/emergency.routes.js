const express = require('express')
const router = express.Router()
const {
  triggerEmergency,
  resolveEmergency,
  getActiveEmergencies
} = require('../controllers/emergency.controller')

router.post('/', triggerEmergency)
router.patch('/:id/resolve', resolveEmergency)
router.get('/active', getActiveEmergencies)

module.exports = router