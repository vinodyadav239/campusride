const Demand = require('../models/Demand')
const { getSurgeMultiplier } = require('../utils/surgeEngine')

const attachSurge = async (req, res, next) => {
  try {
    const { destination } = req.body

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

    demand.surgeMultiplier = surge
    await demand.save()

    req.surge = surge
    next()

  } catch (error) {
    res.status(500).json({ message: 'Surge calculation failed' })
  }
}

module.exports = { attachSurge }