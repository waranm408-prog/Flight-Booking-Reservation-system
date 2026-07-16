const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../Models/Booking');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'FBR_SECRET_KEY';

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Missing authentication token' });

  jwt.verify(token, JWT_SECRET, function (err, decoded) {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

function authenticateAdmin(req, res, next) {
  authenticateUser(req, res, function () {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
  });
}

router.get('/', authenticateUser, async function (req, res) {
  try {
    const requestedEmail = (req.query.email || '').toString().trim();
    const currentEmail = (req.user?.email || '').toString().trim();
    const currentUserId = (req.user?.id || '').toString().trim();
    const isAdmin = req.user?.role === 'admin';

    let query = {};

    if (isAdmin) {
      if (requestedEmail) {
        query = {
          $or: [
            { userEmail: requestedEmail },
            { 'passengers.email': requestedEmail },
          ],
        };
      }
    } else {
      const emailFilter = requestedEmail || currentEmail;
      if (emailFilter) {
        query = {
          $or: [
            { userEmail: emailFilter },
            { userId: currentUserId || null },
            { 'passengers.email': emailFilter },
          ],
        };
      } else if (currentUserId) {
        query = {
          $or: [
            { userId: currentUserId },
            { userEmail: currentEmail },
          ],
        };
      } else {
        query = { userEmail: currentEmail };
      }
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) {
    console.error('Failed to load bookings:', error);
    res.status(500).json({ message: 'Failed to load bookings.' });
  }
});

router.put('/:id/status', authenticateAdmin, async function (req, res) {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Failed to update booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status.' });
  }
});

module.exports = router;
