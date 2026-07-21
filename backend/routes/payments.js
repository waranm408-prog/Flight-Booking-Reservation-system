const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../Models/Booking');
const { sendEmail } = require('../utils/brevoEmail');
require('dotenv').config();

const router = express.Router();

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function isEmailConfigured() {
  const apiKey = process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim();
  const from = process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim();

  return Boolean(apiKey && from);
}

function resolveRecipientEmail(bookingData, fallbackEmail = '') {
  const explicitEmail = (bookingData?.userEmail || fallbackEmail || '').toString().trim();
  if (explicitEmail) {
    return explicitEmail;
  }

  const passengerEmails = Array.isArray(bookingData?.passengers)
    ? bookingData.passengers
        .map((passenger) => (passenger?.email || '').toString().trim())
        .filter(Boolean)
    : [];

  return passengerEmails[0] || '';
}

function formatPassengerSummary(passengers) {
  if (!Array.isArray(passengers) || passengers.length === 0) {
    return 'N/A';
  }

  return passengers
    .map((passenger) => {
      const name = (passenger?.name || '').toString().trim();
      const email = (passenger?.email || '').toString().trim();
      if (name && email) {
        return `${name} (${email})`;
      }
      return name || email || 'Traveler';
    })
    .join('<br/>');
}

function formatSeatSummary(seats) {
  if (!Array.isArray(seats) || seats.length === 0) {
    return 'N/A';
  }

  return seats.join(', ');
}

function normalizePassengers(passengers, fallbackEmail = '') {
  if (!Array.isArray(passengers)) {
    return [];
  }

  return passengers
    .map((passenger) => ({
      name: (passenger?.name || '').toString().trim(),
      phone: (passenger?.phone || '').toString().trim(),
      email: (passenger?.email || fallbackEmail || '').toString().trim(),
    }))
    .filter((passenger) => passenger.name || passenger.phone || passenger.email);
}

async function sendBookingConfirmationEmail(recipientEmail, bookingData, paymentId, orderId) {
  if (!recipientEmail) {
    console.warn('No recipient email provided for booking confirmation.');
    return;
  }

  if (!isEmailConfigured()) {
    console.log(`Booking confirmation email for ${recipientEmail} would be sent. Configure BREVO_API_KEY and EMAIL_FROM to enable delivery.`);
    return;
  }

  const subject = `Booking confirmed for ${bookingData.flightName || 'your flight'}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="color: #2563eb;">Your flight booking is confirmed</h2>
      <p>Hi,</p>
      <p>Your payment was successful and your booking has been confirmed.</p>
      <p><strong>Flight:</strong> ${bookingData.flightName || 'N/A'}</p>
      <p><strong>Route:</strong> ${bookingData.origin || 'N/A'} → ${bookingData.destination || 'N/A'}</p>
      <p><strong>Departure:</strong> ${bookingData.departureTime || 'N/A'}</p>
      <p><strong>Arrival:</strong> ${bookingData.arrivalTime || 'N/A'}</p>
      <p><strong>Cabin Class:</strong> ${bookingData.cabinClass || 'Economy'}</p>
      <p><strong>Passenger(s):</strong><br/>${formatPassengerSummary(bookingData.passengers)}</p>
      <p><strong>Seats:</strong> ${formatSeatSummary(bookingData.seats)}</p>
      <p><strong>Total Amount:</strong> ₹${Number(bookingData.amount || 0).toLocaleString('en-IN')}</p>
      <p><strong>Payment ID:</strong> ${paymentId}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p>Thank you for choosing SkyElite.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: recipientEmail,
      subject,
      html,
      senderName: 'SkyElite Support',
      senderEmail: process.env.EMAIL_FROM,
    });
    console.log(`Booking confirmation email sent to ${recipientEmail}`);
  } catch (error) {
    console.error(`Failed to send booking confirmation to ${recipientEmail}:`, error?.message || error);
  }
}

router.post('/create-order', async function (req, res) {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'A valid amount is required.' });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({ message: 'Razorpay credentials are not configured.' });
    }

    const order = await razorpay.orders.create({
      amount: Number(amount),
      currency,
      receipt: receipt || `fbr-${Date.now()}`,
      notes: {
        ...notes,
        source: 'flight-booking-system',
      },
    });

    res.json({ success: true, order });
  } catch (error) {
    console.error('Failed to create Razorpay order:', error);
    res.status(500).json({ message: 'Unable to initialize payment.' });
  }
});

router.post('/verify', async function (req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification payload is incomplete.' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Razorpay secret is not configured.' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(razorpay_signature);

    if (expectedBuffer.length !== signatureBuffer.length) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    const isAuthentic = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    if (bookingData) {
      const normalizedPassengers = normalizePassengers(bookingData.passengers, bookingData.userEmail || '');
      const userEmail = (bookingData.userEmail || '').toString().trim() || normalizedPassengers[0]?.email || '';

      const booking = new Booking({
        userId: bookingData.userId || null,
        userEmail,
        flightName: bookingData.flightName || '',
        origin: bookingData.origin || '',
        destination: bookingData.destination || '',
        departureTime: bookingData.departureTime || '',
        arrivalTime: bookingData.arrivalTime || '',
        cabinClass: bookingData.cabinClass || 'Economy',
        passengers: normalizedPassengers,
        seats: bookingData.seats || [],
        amount: bookingData.amount || 0,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'confirmed',
      });

      await booking.save();

      try {
        if (process.env.BREVO_API_KEY && process.env.EMAIL_FROM) {
          await sendBookingConfirmationEmail(userEmail, booking, booking.paymentId, booking.orderId);
        }
      } catch (mailError) {
        console.error('Booking confirmation email failed:', mailError);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      payment: { razorpay_order_id, razorpay_payment_id },
    });
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ message: 'Payment verification failed.' });
  }
});

module.exports = router;
