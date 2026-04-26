const jwt = require('jsonwebtoken')
const User = require('../models/User.js')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, gender, emergencyName, emergencyPhone } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const emergencyContacts = []
    if (emergencyName && emergencyPhone) {
      emergencyContacts.push({
        name: emergencyName,
        phone: emergencyPhone
      })
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      gender: gender || 'other',
      emergencyContacts
    })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    res.json(user)

  } catch (error) {
    res.status(401).json({ message: 'Not authorized' })
  }
}

// reusable function for ride controller to verify token
const verifyToken = (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded

  } catch (error) {
    return null
  }
}

module.exports = { register, login, me, verifyToken }