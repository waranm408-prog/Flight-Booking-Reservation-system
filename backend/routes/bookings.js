const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../Models/Booking');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'FBR_SECRET_KEY';

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  console.log('=== authenticateUser ===');
  console.log('Has token:', !!token);

  if (!token) return res.status(401).json({ message: 'Missing authentication token' });

  jwt.verify(token, JWT_SECRET, function (err, decoded) {
    if (err) {
      console.log('Token verification error:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    console.log('Token decoded:', { email: decoded.email, role: decoded.role });
    req.user = decoded;
    next();
  });
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Missing authentication token' });

  jwt.verify(token, JWT_SECRET, function (err, decoded) {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    if (decoded?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
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

router.put('/:id/status', authenticateUser, async function (req, res) {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    const isAdmin = req.user?.role === 'admin';
    const currentEmail = (req.user?.email || '').toString().trim();

    console.log('=== Update Booking Status ===');
    console.log('User:', { email: currentEmail, role: req.user?.role, isAdmin });
    console.log('Requested status:', status);
    console.log('Booking ID:', bookingId);

    // Find the booking first
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.log('Booking not found');
      return res.status(404).json({ message: 'Booking not found.' });
    }

    console.log('Booking found:', { 
      userEmail: booking.userEmail, 
      passengerEmails: booking.passengers?.map(p => p.email) 
    });

    // Check permissions
    // Admins can update any booking to any status
    // Regular users can only cancel their own bookings (NOT confirm)
    if (!isAdmin) {
      // Check if this booking belongs to the current user
      const isOwner = 
        booking.userEmail === currentEmail ||
        booking.passengers?.some(p => p.email === currentEmail);

      console.log('Ownership check:', { isOwner, currentEmail, bookingUserEmail: booking.userEmail });

      if (!isOwner) {
        console.log('Permission denied: Not owner');
        return res.status(403).json({ message: 'You can only update your own bookings.' });
      }

      // Regular users can only cancel their bookings, NOT confirm or other statuses
      if (status !== 'cancelled') {
        console.log('Permission denied: User can only cancel');
        return res.status(403).json({ message: 'You can only cancel your own bookings.' });
      }
    }

    console.log('Permission granted, updating booking...');

    // Update the booking status
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { status } },
      { new: true }
    );

    console.log('Booking updated successfully');
    res.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Failed to update booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status.' });
  }
});

module.exports = router;
