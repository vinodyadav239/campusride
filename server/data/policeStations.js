const POLICE_STATIONS = [
  {
    name: 'Tirupati Town Police Station',
    phone: '08772222222',
    whatsapp: '919100000001',
    latitude: 13.6288,
    longitude: 79.4192
  },
  {
    name: 'Alipiri Police Station',
    phone: '08773333333',
    whatsapp: '919100000002',
    latitude: 13.6100,
    longitude: 79.4050
  },
  {
    name: 'Tiruchanur Police Station',
    phone: '08774444444',
    whatsapp: '919100000003',
    latitude: 13.5950,
    longitude: 79.4300
  }
]

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const findNearestStation = (userLat, userLon) => {
  let nearest = null
  let minDistance = Infinity

  POLICE_STATIONS.forEach(station => {
    const distance = getDistance(userLat, userLon, station.latitude, station.longitude)
    if (distance < minDistance) {
      minDistance = distance
      nearest = { ...station, distance: minDistance.toFixed(2) }
    }
  })

  return nearest
}

module.exports = { findNearestStation, POLICE_STATIONS }