const mongoose = require('mongoose')

const demandSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: true,
    unique: true
  },
  waitingCount: {
    type: Number,
    default: 0
  },
  availableDrivers: {
    type: Number,
    default: 0
  },
  surgeMultiplier: {
    type: Number,
    default: 1.0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

module.exports = mongoose.model('Demand', demandSchema)