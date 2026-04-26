const { Server } = require('socket.io')

let io

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    // student joins their ride room
    socket.on('join-ride', (rideId) => {
      socket.join(rideId)
      console.log(`User joined ride room: ${rideId}`)
    })

    // driver joins driver room
    socket.on('join-driver', (driverId) => {
      socket.join(driverId)
      console.log(`Driver joined: ${driverId}`)
    })

    // driver updates ride status
    socket.on('update-ride-status', ({ rideId, status }) => {
      io.to(rideId).emit('ride-status-changed', { rideId, status })
      console.log(`Ride ${rideId} status updated to: ${status}`)
    })

    // driver location update
    socket.on('driver-location', ({ rideId, location }) => {
      io.to(rideId).emit('location-updated', location)
    })

    // demand updated — broadcast to everyone
    socket.on('demand-update', (demandData) => {
      io.emit('demand-changed', demandData)
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`)
    })
  })
}

// use this in controllers to emit events from server side
const getIO = () => {
  if (!io) throw new Error('Socket not initialized')
  return io
}

module.exports = { initSocket, getIO }