const ROUTES = {
  'Tirupati Bus Stand': 30,
  'Tirupati Railway Station': 36,
  'SR Nagar Mall': 25,
  'PVR Cinemas': 20,
  'Alipiri': 16,
  'RTC Complex': 28
}

const LOCATIONS = ['College Gate', ...Object.keys(ROUTES)]

const PLATFORM_FEE = 2

const getBaseFare = (source, destination) => {
  // college → destination
  if (source === 'College Gate') return ROUTES[destination] || 30
  // destination → college (return trip, same fare)
  if (destination === 'College Gate') return ROUTES[source] || 30
  // between two non-college locations (rare case)
  return 35
}

const calculateFare = ({ source, destination, type, riders = 1, surgeMultiplier = 1.0 }) => {
  const base = getBaseFare(source, destination)

  const hour = new Date().getHours()
  const isNight = hour >= 22 || hour < 6
  const nightPremium = isNight ? 1.2 : 1.0

  const isReturn = destination === 'College Gate'

  let fare = (base + PLATFORM_FEE) * surgeMultiplier * nightPremium

  if (type === 'pool') fare = fare / riders
  if (type === 'scheduled') fare = fare * 0.9

  return {
    baseFare: base,
    platformFee: PLATFORM_FEE,
    surgeMultiplier,
    nightPremium,
    isNight,
    isReturn,
    totalFare: Math.round(fare)
  }
}

module.exports = { calculateFare, LOCATIONS, ROUTES }