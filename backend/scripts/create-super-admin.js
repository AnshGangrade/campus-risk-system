require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../models/User')

async function createSuperAdmin() {
  await mongoose.connect(process.env.MONGODB_URI)
  const existing = await User.findOne({ role: 'SUPER_ADMIN' })
  if (existing) {
    console.log('Super admin already exists:', existing.email)
    process.exit(0)
  }
  const user = await User.create({
    name:     'Super Admin',
    email:    'superadmin@campus.edu',
    password: 'SuperAdmin@2025',
    role:     'SUPER_ADMIN',
  })
  console.log('Super admin created!')
  console.log('Email:   ', user.email)
  console.log('Password: SuperAdmin@2025')
  console.log('CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN')
  process.exit(0)
}

createSuperAdmin().catch(err => { console.error(err); process.exit(1) })