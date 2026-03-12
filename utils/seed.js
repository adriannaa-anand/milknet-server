/**
 * seed.js — Populate the database with sample milkmen and a test customer
 * Run: npm run seed
 */
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const User     = require('../models/User')
const Milkman  = require('../models/Milkman')

const SEED_MILKMEN = [
  {
    name: 'Ramesh Kumar', email: 'ramesh@milknet.com',
    area: 'Koramangala, Bangalore', price: 65,
    about: 'Serving Koramangala for 8 years. Fresh farm milk from my own dairy in Hoskote.',
    deliveryTime: '5:30 AM – 6:00 AM', experience: '8 years', joinedYear: '2016',
    milkType: ['Cow Milk', 'Buffalo Milk'], schedule: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    color: '#E8A838', available: true, badge: 'Top Rated',
  },
  {
    name: 'Suresh Yadav', email: 'suresh@milknet.com',
    area: 'Indiranagar, Bangalore', price: 60,
    about: 'Specializing in A2 milk from Gir cows. Daily quality checks.',
    deliveryTime: '6:00 AM – 6:30 AM', experience: '5 years', joinedYear: '2019',
    milkType: ['Cow Milk', 'A2 Milk'], schedule: ['Mon','Tue','Wed','Thu','Fri','Sat'],
    color: '#4A9E6B', available: true, badge: 'Verified',
  },
  {
    name: 'Mohan Dairy', email: 'mohan@milknet.com',
    area: 'HSR Layout, Bangalore', price: 70,
    about: 'Family-run dairy since 2012. Fresh homemade paneer and curd also available.',
    deliveryTime: '5:00 AM – 5:30 AM', experience: '12 years', joinedYear: '2012',
    milkType: ['Buffalo Milk', 'Paneer', 'Curd'], schedule: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    color: '#D4614A', available: true, badge: 'Most Experienced',
  },
  {
    name: 'Venkat Milk', email: 'venkat@milknet.com',
    area: 'Whitefield, Bangalore', price: 58,
    about: 'Affordable fresh milk delivery in Whitefield.',
    deliveryTime: '6:30 AM – 7:00 AM', experience: '3 years', joinedYear: '2021',
    milkType: ['Cow Milk'], schedule: ['Mon','Tue','Wed','Thu','Fri'],
    color: '#7B68C8', available: false, badge: null,
  },
  {
    name: 'Priya Organics', email: 'priya@milknet.com',
    area: 'JP Nagar, Bangalore', price: 85,
    about: 'Premium organic milk from certified farms. FSSAI licensed.',
    deliveryTime: '6:00 AM – 6:45 AM', experience: '6 years', joinedYear: '2018',
    milkType: ['Organic A2 Milk', 'Goat Milk', 'Curd'], schedule: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    color: '#E85E8A', available: true, badge: 'Premium',
  },
  {
    name: 'Dairy Fresh Co.', email: 'dairyfresh@milknet.com',
    area: 'Electronic City, Bangalore', price: 62,
    about: 'Serving the IT corridor. Full-fat cow milk and low-fat toned milk available.',
    deliveryTime: '5:45 AM – 6:15 AM', experience: '4 years', joinedYear: '2020',
    milkType: ['Cow Milk', 'Toned Milk'], schedule: ['Mon','Tue','Wed','Thu','Fri','Sat'],
    color: '#2AA8B8', available: true, badge: 'New & Popular',
  },
]

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Clear existing data
  await User.deleteMany({})
  await Milkman.deleteMany({})
  console.log('Cleared existing users and milkmen')

  const password = await bcrypt.hash('password123', 12)

  // Create test customer
  const customer = await User.create({
    name: 'Arun Kumar', email: 'arun@milknet.com',
    password, role: 'customer', phone: '+91 99999 00000', area: 'Koramangala',
  })
  console.log(`Customer created: ${customer.email}`)

  // Create milkmen
  for (const data of SEED_MILKMEN) {
    const user = await User.create({
      name: data.name, email: data.email, password, role: 'milkman',
    })
    await Milkman.create({
      user: user._id, ...data,
      reviewSummary: { averageRating: (Math.random() * 1.5 + 3.5).toFixed(1), reviewCount: Math.floor(Math.random() * 150 + 20), totalRating: 0 },
    })
    console.log(`Milkman created: ${data.name}`)
  }

  console.log('\nSeed complete!')
  console.log('Test login: arun@milknet.com / password123')
  console.log('Milkman login: ramesh@milknet.com / password123')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
