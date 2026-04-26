const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const http = require('http')
const connectDB = require('./config/db.js')
const { initSocket } = require('./config/socket.js')

dotenv.config()

const app = express()
app.use(cors())
const server = http.createServer(app)

connectDB()
initSocket(server)

app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/rides', require('./routes/ride.routes'))
app.use('/api/emergency', require('./routes/emergency.routes'))

app.get('/', (req, res) => {
  res.json({ message: 'CampusRide API is running!' })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})