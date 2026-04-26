const { getIO } = require('../config/socket.js')
const Ride = require('../models/Ride.js')
const Demand = require('../models/Demand.js')
const User = require('../models/User.js')
const { calculateFare } = require('../utils/fareCalculator.js')
const { getSurgeMultiplier } = require('../utils/surgeEngine.js')
const jwt = require('jsonwebtoken')

// helper to get user from token
const getUserFromToken = async (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return null
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return await User.findById(decoded.id)
  } catch {
    return null
  }
}

// POST /api/rides - book a ride
const bookRide = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ message: 'Not authorized' })
    if (user.role !== 'student') return res.status(403).json({ message: 'Only students can book rides' })

    const { source = 'College Gate', destination, type, riders = 1, scheduledAt } = req.body

    if (source === destination) {
      return res.status(400).json({ message: 'Source and destination cannot be same' })
    }

    let demand = await Demand.findOne({ destination })
    if (!demand) {
      demand = await Demand.create({
        destination,
        waitingCount: 0,
        availableDrivers: 0,
        surgeMultiplier: 1.0
      })
    }

    const surge = getSurgeMultiplier(demand.waitingCount, demand.availableDrivers)
    const fareDetails = calculateFare({ source, destination, type, riders, surgeMultiplier: surge })

    const ride = await Ride.create({
      studentId: user._id,
      source,
      destination,
      type,
      fare: fareDetails.totalFare,
      baseFare: fareDetails.baseFare,
      surgeMultiplier: surge,
      isNight: fareDetails.isNight,
      isReturn: fareDetails.isReturn,
      scheduledAt: scheduledAt || null
    })

    demand.waitingCount += 1
    demand.surgeMultiplier = getSurgeMultiplier(demand.waitingCount, demand.availableDrivers)
    await demand.save()

    // emit real time demand update
    const io = getIO()
    io.emit('demand-changed', {
      destination,
      waitingCount: demand.waitingCount,
      surgeMultiplier: demand.surgeMultiplier
    })

    res.status(201).json({
      message: 'Ride booked successfully',
      ride,
      fareDetails
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

 

// GET /api/rides/my-rides - get student's ride history
const myRides = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ message: 'Not authorized' })

    const rides = await Ride.find({ studentId: user._id })
      .sort({ createdAt: -1 })
      .populate('driverId', 'name phone rating')

    res.json(rides)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/rides/pending - driver sees all pending rides
const pendingRides = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ message: 'Not authorized' })
    if (user.role !== 'driver') return res.status(403).json({ message: 'Drivers only' })

    const rides = await Ride.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name phone')

    res.json(rides)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PATCH /api/rides/:id/accept - driver accepts a ride
const acceptRide = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ message: 'Not authorized' })
    if (user.role !== 'driver') return res.status(403).json({ message: 'Drivers only' })

    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: 'Ride not found' })
    if (ride.status !== 'pending') return res.status(400).json({ message: 'Ride already taken' })

    ride.driverId = user._id
    ride.status = 'accepted'
    await ride.save()
    // notify student in real time
const io = getIO()
io.to(ride._id.toString()).emit('ride-status-changed', {
  rideId: ride._id,
  status: 'accepted',
  driver: {
    name: user.name,
    phone: user.phone,
    rating: user.rating
  }
})

    // decrement waiting count
    const demand = await Demand.findOne({ destination: ride.destination })
    if (demand) {
      demand.waitingCount = Math.max(0, demand.waitingCount - 1)
      demand.surgeMultiplier = getSurgeMultiplier(demand.waitingCount, demand.availableDrivers)
      await demand.save()
    }

    res.json({ message: 'Ride accepted', ride })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PATCH /api/rides/:id/status - update ride status
const updateStatus = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ message: 'Not authorized' })

    const { status } = req.body
    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: 'Ride not found' })

    ride.status = status
    await ride.save()
    const io = getIO()
io.to(ride._id.toString()).emit('ride-status-changed', {
  rideId: ride._id,
  status: ride.status
})

    if (status === 'completed') {
      await User.findByIdAndUpdate(user._id, { $inc: { totalRides: 1 } })
    }

    res.json({ message: 'Status updated', ride })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE /api/rides/:id - cancel a ride
const cancelRide = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ message: 'Not authorized' })

    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: 'Ride not found' })
    if (ride.status === 'completed') return res.status(400).json({ message: 'Cannot cancel completed ride' })

    ride.status = 'cancelled'
    await ride.save()

    // decrement demand
    const demand = await Demand.findOne({ destination: ride.destination })
    if (demand) {
      demand.waitingCount = Math.max(0, demand.waitingCount - 1)
      await demand.save()
    }

    res.json({ message: 'Ride cancelled', ride })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
// GET /api/rides/driver-rides
const driverRides = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ message: 'Not authorized' })

    const rides = await Ride.find({ driverId: user._id })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name phone')

    res.json(rides)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
// GET /api/rides/:id - get single ride
const getRide = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ message: 'Not authorized' })

    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'name phone rating')
      .populate('studentId', 'name phone')

    if (!ride) return res.status(404).json({ message: 'Ride not found' })

    res.json(ride)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  bookRide, myRides, pendingRides,
  driverRides, acceptRide, updateStatus,
  cancelRide, getRide
}



