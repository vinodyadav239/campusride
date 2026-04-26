const Emergency = require('../models/Emergency')
const Ride = require('../models/Ride')
const User = require('../models/User')
const { findNearestStation } = require('../data/policeStations')
const { getIO } = require('../config/socket')
const jwt = require('jsonwebtoken')

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

const triggerEmergency = async (req, res) => {
  try {
    const user = await getUserFromToken(req)
    if (!user) return res.status(401).json({ message: 'Not authorized' })

    const { rideId, latitude, longitude } = req.body

    const ride = await Ride.findById(rideId)
      .populate('driverId', 'name phone')

    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`
    const nearestStation = findNearestStation(latitude, longitude)

    // create emergency record
    const emergency = await Emergency.create({
      studentId: user._id,
      rideId,
      location: { latitude, longitude },
      mapsLink,
      nearestStation,
      alertsSent: {
        police: true,
        parents: user.emergencyContacts?.length > 0,
        security: true
      }
    })

    // flag the ride
    if (ride) {
      ride.status = 'flagged'
      await ride.save()
    }

    // emit to security dashboard via Socket.IO
    const io = getIO()
    io.emit('emergency-alert', {
      emergencyId: emergency._id,
      student: {
        name: user.name,
        phone: user.phone,
        gender: user.gender
      },
      driver: ride?.driverId ? {
        name: ride.driverId.name,
        phone: ride.driverId.phone
      } : null,
      location: { latitude, longitude },
      mapsLink,
      nearestStation,
      emergencyContacts: user.emergencyContacts,
      time: new Date()
    })

    // warn the driver via socket
    if (ride?.driverId) {
      io.emit('driver-warning', {
        driverId: ride.driverId._id,
        message: 'This ride has been flagged for safety monitoring. Your details have been shared with college security.'
      })
    }

    res.status(201).json({
      message: 'Emergency alert triggered successfully',
      emergency,
      nearestStation,
      mapsLink,
      contactsAlerted: user.emergencyContacts
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const resolveEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
    if (!emergency) return res.status(404).json({ message: 'Emergency not found' })

    emergency.status = 'resolved'
    emergency.resolvedAt = new Date()
    await emergency.save()

    const io = getIO()
    io.emit('emergency-resolved', { emergencyId: emergency._id })

    res.json({ message: 'Emergency resolved', emergency })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getActiveEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ status: 'active' })
      .populate('studentId', 'name phone gender emergencyContacts')
      .populate('rideId')
      .sort({ createdAt: -1 })

    res.json(emergencies)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { triggerEmergency, resolveEmergency, getActiveEmergencies }