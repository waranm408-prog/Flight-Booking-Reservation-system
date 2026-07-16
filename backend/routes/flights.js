var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Flight = require('../Models/Flight');

const JWT_SECRET = process.env.JWT_SECRET || 'FBR_SECRET_KEY';

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Missing authentication token' });

  jwt.verify(token, JWT_SECRET, function (err, decoded) {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
    next();
  });
}

router.get('/', async function (req, res) {
  try {
    var flights = await Flight.find({});
    res.json({ flights });
  } catch (error) {
    console.error('Failed to fetch flights:', error);
    res.status(500).json({ message: 'Failed to fetch flights.' });
  }
});

router.post('/', authenticateAdmin, async function (req, res) {
  try {
    const payload = req.body || {};
    const flightData = {
      flightNo: payload.flightNo?.toString().trim(),
      airline: payload.airline?.toString().trim(),
      origin: payload.origin?.toString().trim(),
      destination: payload.destination?.toString().trim(),
      departureDate: payload.departureDate?.toString().trim(),
      departureTime: payload.departureTime?.toString().trim(),
      arrivalTime: payload.arrivalTime?.toString().trim(),
      duration: payload.duration?.toString().trim(),
      stops: Number(payload.stops || 0),
      price: payload.price?.toString().trim(),
      cabinClass: payload.cabinClass?.toString().trim() || 'Economy',
      logo: payload.logo?.toString().trim() || '',
      seatsAvailable: Number(payload.seatsAvailable || 0),
    };

    const existing = await Flight.findOne({ flightNo: flightData.flightNo });
    if (existing) {
      return res.status(409).json({ message: 'Flight number already exists.' });
    }

    const flight = new Flight(flightData);
    await flight.save();
    res.status(201).json({ message: 'Flight added successfully.', flight });
  } catch (error) {
    console.error('Failed to add flight:', error);
    res.status(500).json({ message: 'Failed to add flight.' });
  }
});

router.get('/search', async function (req, res) {
  try {
    var from = (req.query.from || '').toString().trim().toLowerCase();
    var to = (req.query.to || '').toString().trim().toLowerCase();
    var query = {};

    if (from) {
      query.origin = { $regex: new RegExp(from, 'i') };
    }
    if (to) {
      query.destination = { $regex: new RegExp(to, 'i') };
    }
    

    var flights = await Flight.find(query);
    res.json({ flights });
  } catch (error) {
    console.error('Search flights failed:', error);
    res.status(500).json({ message: 'Search failed.' });
  }
});

module.exports = router;
