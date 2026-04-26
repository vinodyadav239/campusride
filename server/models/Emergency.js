const mongoose = require('mongoose')

const emergencySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  mapsLink: String,
  nearestStation: {
    name: String,
    phone: String,
    whatsapp: String
  },
  alertsSent: {
    police: { type: Boolean, default: false },
    parents: { type: Boolean, default: false },
    security: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active'
  },
  resolvedAt: Date
}, { timestamps: true })

module.exports = mongoose.model('Emergency', emergencySchema)