const mongoose = require('mongoose')

const rideSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  source: {
    type: String,
    required: true,
    default: 'College Gate'
  },
  destination: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pool', 'solo', 'scheduled'],
    required: true
  },
  fare: {
    type: Number,
    required: true
  },
  baseFare: {
    type: Number,
    required: true
  },
  surgeMultiplier: {
    type: Number,
    default: 1.0
  },
  isNight: {
    type: Boolean,
    default: false
  },
  isReturn: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'active', 'completed', 'cancelled','flagged'],
    default: 'pending'
  },
  poolRiders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  scheduledAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

module.exports = mongoose.model('Ride', rideSchema)