const getSurgeMultiplier = (waitingCount, availableDrivers) => {
  if (availableDrivers === 0) return 1.4

  const ratio = waitingCount / availableDrivers

  if (ratio > 4) return 1.4
  if (ratio > 2) return 1.2
  return 1.0
}

const getSurgeLabel = (multiplier) => {
  if (multiplier >= 1.4) return { label: 'High demand', color: 'red' }
  if (multiplier >= 1.2) return { label: 'Moderate demand', color: 'amber' }
  return { label: 'Normal', color: 'green' }
}

module.exports = { getSurgeMultiplier, getSurgeLabel }