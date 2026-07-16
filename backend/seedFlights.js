require('dotenv').config();
const mongoose = require('mongoose');
const Flight = require('./Models/Flight');

const flights = [
  {
    flightNo: 'IN101',
    airline: 'Air India',
    origin: 'Chennai',
    destination: 'Bangalore',
    departureDate: '2026-07-05',
    departureTime: '08:00 AM',
    arrivalTime: '09:30 AM',
    duration: '1h 30m',
    stops: 0,
    price: 'RS 5,200',
    cabinClass: 'Economy',
    logo: 'https://placehold.co/40x40?text=AI',
    seatsAvailable: 40,
  },
  {
    flightNo: 'SJ202',
    airline: 'SpiceJet',
    origin: 'Delhi',
    destination: 'Mumbai',
    departureDate: '2026-07-05',
    departureTime: '11:00 AM',
    arrivalTime: '01:45 PM',
    duration: '2h 15m',
    stops: 0,
    price: 'RS 6,800',
    cabinClass: 'Economy',
    logo: 'https://placehold.co/40x40?text=SG',
    seatsAvailable: 35,
  },
  {
    flightNo: 'AI303',
    airline: 'AirAsia India',
    origin: 'Mumbai',
    destination: 'Goa',
    departureDate: '2026-07-06',
    departureTime: '02:30 PM',
    arrivalTime: '04:15 PM',
    duration: '1h 45m',
    stops: 0,
    price: 'RS 4,250',
    cabinClass: 'Economy',
    logo: 'https://placehold.co/40x40?text=AA',
    seatsAvailable: 28,
  },
  {
    flightNo: 'UK404',
    airline: 'Vistara',
    origin: 'Chennai',
    destination: 'Delhi',
    departureDate: '2026-07-05',
    departureTime: '07:00 AM',
    arrivalTime: '09:50 AM',
    duration: '2h 50m',
    stops: 0,
    price: 'RS 9,200',
    cabinClass: 'Business',
    logo: 'https://placehold.co/40x40?text=VT',
    seatsAvailable: 18,
  },
  {
    flightNo: 'SG505',
    airline: 'IndiGo',
    origin: 'Bangalore',
    destination: 'Hyderabad',
    departureDate: '2026-07-05',
    departureTime: '04:45 PM',
    arrivalTime: '06:10 PM',
    duration: '1h 25m',
    stops: 0,
    price: 'RS 5,900',
    cabinClass: 'Economy',
    logo: 'https://placehold.co/40x40?text=6E',
    seatsAvailable: 50,
  },
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const existing = await Flight.countDocuments();
    if (existing > 0) {
      console.log(`Flight collection already has ${existing} documents. Skipping seeding.`);
      process.exit(0);
    }

    const inserted = await Flight.insertMany(flights);
    console.log(`Seeded ${inserted.length} flights.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed flights:', error);
    process.exit(1);
  });
