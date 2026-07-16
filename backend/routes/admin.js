const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../Models/Booking');
const Flight = require('../Models/Flight');
const User = require('../Models/User');

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
    const [bookingsCount, flightsCount, usersCount, paymentsCountAgg, revenueAgg] = await Promise.all([
      Booking.countDocuments(),
      Flight.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments({ paymentId: { $exists: true, $ne: '' } }),
      Booking.aggregate([
        { $match: { paymentId: { $exists: true, $ne: '' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalRevenue = Array.isArray(revenueAgg) && revenueAgg[0] ? revenueAgg[0].total : 0;

    res.json({
      bookingsCount,
      flightsCount,
      usersCount,
      paymentsCount: paymentsCountAgg,
      totalRevenue,
    });
  } catch (error) {
    console.error('Failed to load admin stats:', error);
    res.status(500).json({ message: 'Failed to load stats.' });
  }
});

module.exports = router;
