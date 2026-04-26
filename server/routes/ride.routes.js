const express = require('express')
const router = express.Router()
const { 
  bookRide, myRides, pendingRides,
  driverRides, acceptRide, updateStatus,
  cancelRide, getRide
} = require('../controllers/ride.controller.js')



router.post('/', bookRide)
router.get('/my-rides', myRides)
router.get('/pending', pendingRides)
router.get('/driver-rides', driverRides)
router.get('/:id', getRide)
router.patch('/:id/accept', acceptRide)
router.patch('/:id/status', updateStatus)
router.delete('/:id', cancelRide)


module.exports = router