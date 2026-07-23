const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../Models/Booking');
const Flight = require('../Models/Flight');
const User = require('../Models/User');
const { fetchLiveFlights } = require('./flights');

const router = express.Router();
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

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

router.get('/flights', authenticateAdmin, async function (req, res) {
  try {
    const requestedDate = (req.query.date || req.query.departureDate || 'today').toString().trim();
    const targetDate = requestedDate.toLowerCase() === 'today' ? getTodayDateString() : requestedDate;

    const flights = await fetchLiveFlights('chennai', 'bangalore', 'Economy', targetDate);
    const { start, end } = getTodayRange();
    const todayBookings = await Booking.find({
      createdAt: { $gte: start, $lt: end },
    }).select('flightId flightName origin destination userEmail passengers seats amount status createdAt');

    const formattedBookings = todayBookings.map((booking) => ({
      id: booking._id,
      flightId: booking.flightId || '',
      flightName: booking.flightName,
      origin: booking.origin,
      destination: booking.destination,
      userEmail: booking.userEmail,
      passengers: booking.passengers,
      seats: booking.seats,
      amount: booking.amount,
      status: booking.status,
      createdAt: booking.createdAt,
    }));

    const formattedFlights = (flights || []).map((flight) => ({
      id: flight.id,
      flightNo: flight.flightNo,
      airline: flight.airline,
      origin: flight.origin,
      destination: flight.destination,
      departureDate: targetDate || getTodayDateString(),
      departureTime: flight.departureTime || '',
      arrivalTime: flight.arrivalTime || '',
      duration: flight.duration,
      stops: flight.stops || 0,
      price: flight.price,
      cabinClass: flight.cabinClass || 'Economy',
      seatsAvailable: flight.seatsAvailable || 0,
      bookings: todayBookings
        .filter((booking) => {
          if (booking.flightId) return String(booking.flightId) === String(flight.id);
          return booking.flightName === flight.airline
            && booking.origin === flight.origin
            && booking.destination === flight.destination;
        })
        .map((booking) => ({
          id: booking._id,
          userEmail: booking.userEmail,
          passengers: booking.passengers,
          seats: booking.seats,
          amount: booking.amount,
          status: booking.status,
          createdAt: booking.createdAt,
        })),
    }));

    return res.json({ flights: formattedFlights, bookings: formattedBookings, bookingDate: getTodayDateString() });
  } catch (error) {
    console.error('Failed to load admin flights:', error);
    res.status(500).json({ message: 'Failed to load today’s flights.' });
  }
});

router.get('/users', authenticateAdmin, async function (req, res) {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      authorizedAccess: user.authorizedAccess !== false,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || null,
      loginCount: Array.isArray(user.loginHistory) ? user.loginHistory.length : 0,
      recentLogins: (user.loginHistory || []).slice(-5).reverse().map((entry) => ({
        loggedInAt: entry.loggedInAt,
        ipAddress: entry.ipAddress || 'Unknown',
        userAgent: entry.userAgent || 'Unknown',
      })),
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Failed to load admin users:', error);
    res.status(500).json({ message: 'Failed to load users.' });
  }
});

router.get('/stats', async function (req, res) {
  try {
    const [bookingsCount, flightsCount, usersCount, paymentsCountAgg, revenueAgg, bookedUserIds, cancelledBookingsCount] = await Promise.all([
      Booking.countDocuments(),
      Flight.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments({ paymentId: { $exists: true, $ne: '' } }),
      Booking.aggregate([
        { $match: { paymentId: { $exists: true, $ne: '' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.distinct('userId', { userId: { $ne: null } }),
      Booking.countDocuments({ $or: [{ status: 'cancelled' }, { status: 'canceled' }] }),
    ]);

    const totalRevenue = Array.isArray(revenueAgg) && revenueAgg[0] ? revenueAgg[0].total : 0;
    const uniqueBookedUsers = Array.isArray(bookedUserIds) ? bookedUserIds.length : 0;
    const bookingRate = usersCount > 0 ? Math.round((uniqueBookedUsers / usersCount) * 100) : 0;
    const cancellationRate = bookingsCount > 0 ? Math.round((cancelledBookingsCount / bookingsCount) * 100) : 0;

    res.json({
      bookingsCount,
      flightsCount,
      usersCount,
      paymentsCount: paymentsCountAgg,
      totalRevenue,
      bookingRate,
      cancellationRate,
      cancelledBookingsCount,
    });
  } catch (error) {
    console.error('Failed to load admin stats:', error);
    res.status(500).json({ message: 'Failed to load stats.' });
  }
});

module.exports = router;
