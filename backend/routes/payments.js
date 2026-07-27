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

function normalizeSeats(seats) {
  if (!Array.isArray(seats)) return [];
  return [...new Set(seats.map((seat) => seat.toString().trim().toUpperCase()).filter(Boolean))];
}

function normalizeDateValue(value) {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = value.toString().trim();
  if (!text) return null;

  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

router.get('/seats/:flightId', async function (req, res) {
  try {
    const flightId = (req.params.flightId || '').toString().trim();
    if (!flightId) {
      return res.status(400).json({ message: 'A flight ID is required.' });
    }

    const bookings = await Booking.find({
      flightId,
      status: 'confirmed',
      seats: { $exists: true, $ne: [] },
    }).select('seats -_id');

    const bookedSeats = [...new Set(bookings.flatMap((booking) => normalizeSeats(booking.seats)))];
    return res.json({ flightId, bookedSeats });
  } catch (error) {
    console.error('Failed to load seat availability:', error);
    return res.status(500).json({ message: 'Unable to load seat availability.' });
  }
});

async function sendBookingConfirmationEmail(recipientEmail, bookingData, paymentId, orderId) {
  if (!recipientEmail) {
    console.warn('No recipient email provided for booking confirmation.');
    return;
  }

  if (!isEmailConfigured()) {
    console.log(`Booking confirmation email for ${recipientEmail} would be sent. Configure BREVO_API_KEY and EMAIL_FROM to enable delivery.`);
    return;
  }

  const isRoundTrip = bookingData.isRoundTrip || bookingData.tripType === 'round-trip';
  const subject = `Booking confirmed for ${bookingData.flightName || 'your flight'}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Your flight booking is confirmed ✈️</h2>
      <p>Hi,</p>
      <p>Your payment was successful and your booking has been confirmed.</p>
      
      ${isRoundTrip ? '<h3 style="color: #1e293b; margin-top: 30px;">📍 Trip Type: Round Trip</h3>' : '<h3 style="color: #1e293b; margin-top: 30px;">📍 Trip Type: One Way</h3>'}
      
      <!-- OUTBOUND FLIGHT DETAILS -->
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="margin-top: 0; color: #1e40af; display: flex; align-items: center;">
          ✈️ OUTBOUND FLIGHT
        </h3>
        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
          <p style="margin: 8px 0;"><strong style="color: #475569;">Airline:</strong> ${bookingData.airline || bookingData.flightName || 'N/A'}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">Flight Number:</strong> ${bookingData.flightNo || 'N/A'}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">Route:</strong> ${bookingData.origin || 'N/A'} → ${bookingData.destination || 'N/A'}</p>
          
          <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 12px;">
            <p style="margin: 6px 0;"><strong style="color: #334155;">📅 Departure:</strong> ${bookingData.departureTime || 'N/A'}${bookingData.departureDate ? ` on ${new Date(bookingData.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
            <p style="margin: 6px 0;"><strong style="color: #334155;">🛬 Arrival:</strong> ${bookingData.arrivalTime || 'N/A'}${bookingData.arrivalDate ? ` on ${new Date(bookingData.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
          </div>
          
          <p style="margin: 8px 0; margin-top: 12px;"><strong style="color: #475569;">⏱️ Duration:</strong> ${bookingData.duration || 'N/A'}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">🔄 Stops:</strong> ${bookingData.stops === 0 ? 'Non-stop' : `${bookingData.stops} stop(s)`}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">💺 Cabin Class:</strong> ${bookingData.cabinClass || 'Economy'}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">🪑 Seats:</strong> ${formatSeatSummary(bookingData.seats)}</p>
        </div>
      </div>
      
      ${isRoundTrip ? `
      <!-- RETURN FLIGHT DETAILS -->
      <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #059669;">
        <h3 style="margin-top: 0; color: #047857; display: flex; align-items: center;">
          🔄 RETURN FLIGHT
        </h3>
        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
          <p style="margin: 8px 0;"><strong style="color: #475569;">Airline:</strong> ${bookingData.returnFlightName || bookingData.airline || bookingData.flightName || 'N/A'}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">Flight Number:</strong> ${bookingData.returnFlightNo || bookingData.flightNo || 'N/A'}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">Route:</strong> ${bookingData.destination || 'N/A'} → ${bookingData.origin || 'N/A'}</p>
          
          <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 12px;">
            <p style="margin: 6px 0;"><strong style="color: #334155;">📅 Departure:</strong> ${bookingData.returnDepartureTime || 'N/A'}${bookingData.returnDepartureDate ? ` on ${new Date(bookingData.returnDepartureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : (bookingData.returnDate ? ` on ${new Date(bookingData.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : '')}</p>
            <p style="margin: 6px 0;"><strong style="color: #334155;">🛬 Arrival:</strong> ${bookingData.returnArrivalTime || 'N/A'}${bookingData.returnArrivalDate ? ` on ${new Date(bookingData.returnArrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
          </div>
          
          <p style="margin: 8px 0; margin-top: 12px;"><strong style="color: #475569;">⏱️ Duration:</strong> ${bookingData.duration || 'N/A'}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">🔄 Stops:</strong> ${bookingData.stops === 0 ? 'Non-stop' : `${bookingData.stops} stop(s)`}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">💺 Cabin Class:</strong> ${bookingData.cabinClass || 'Economy'}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">🪑 Return Seats:</strong> ${formatSeatSummary(bookingData.returnSeats)}</p>
        </div>
      </div>
      ` : ''}
      
      <!-- PASSENGER DETAILS -->
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #64748b;">
        <h3 style="margin-top: 0; color: #1e293b;">👥 Passenger Details</h3>
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <p style="margin: 0;">${formatPassengerSummary(bookingData.passengers)}</p>
        </div>
      </div>
      
      <!-- PAYMENT DETAILS -->
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #047857;">💳 Payment Details</h3>
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <p style="margin: 8px 0;"><strong style="color: #475569;">Total Amount:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">₹${Number(bookingData.amount || 0).toLocaleString('en-IN')}</span></p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">Payment ID:</strong> ${paymentId}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">Order ID:</strong> ${orderId}</p>
          <p style="margin: 8px 0;"><strong style="color: #475569;">Status:</strong> <span style="color: #059669; font-weight: bold;">✓ Confirmed</span></p>
        </div>
      </div>
      
      ${bookingData.dataSource === 'live' ? '<div style="background: #dcfce7; padding: 12px; border-radius: 8px; margin: 20px 0;"><p style="color: #059669; font-weight: bold; margin: 0;">✓ Live flight data confirmed</p></div>' : ''}
      
      <p style="margin-top: 30px;">Thank you for choosing SkyElite. Have a safe flight! ✈️</p>
      
      <div style="border-top: 2px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
        <p style="color: #64748b; font-size: 12px; margin: 5px 0;">This is an automated confirmation email. Please keep this for your records.</p>
        <p style="color: #64748b; font-size: 12px; margin: 5px 0;">For support, contact us at support@skyelite.com</p>
      </div>
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
    let savedBooking = null;

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

    const existingBooking = await Booking.findOne({ paymentId: razorpay_payment_id });
    if (existingBooking) {
      return res.json({
        success: true,
        message: 'Payment was already verified.',
        payment: { razorpay_order_id, razorpay_payment_id },
        booking: { id: existingBooking._id },
        alreadyProcessed: true,
      });
    }

    if (bookingData) {
      const normalizedPassengers = normalizePassengers(bookingData.passengers, bookingData.userEmail || '');
      const userEmail = (bookingData.userEmail || '').toString().trim() || normalizedPassengers[0]?.email || '';
      const flightId = (bookingData.flightId || '').toString().trim();
      const seats = normalizeSeats(bookingData.seats);

      if (!flightId) {
        return res.status(400).json({ success: false, message: 'Flight identity is required for seat booking.' });
      }

      if (seats.length !== normalizedPassengers.length) {
        return res.status(400).json({ success: false, message: 'Select one seat for each passenger.' });
      }

      const booking = new Booking({
        userId: bookingData.userId || null,
        userEmail,
        flightId,
        flid: bookingData.flid || null,
        isRoundTrip: Boolean(bookingData.isRoundTrip || bookingData.tripType === 'round-trip'),
        flightName: bookingData.flightName || bookingData.airline || '',
        flightNo: bookingData.flightNo || '',
        airline: bookingData.airline || bookingData.flightName || '',
        origin: bookingData.origin || '',
        destination: bookingData.destination || '',
        departureTime: bookingData.departureTime || '',
        arrivalTime: bookingData.arrivalTime || '',
        departureDate: normalizeDateValue(bookingData.departureDate || ''),
        arrivalDate: normalizeDateValue(bookingData.arrivalDate || ''),
        tripType: bookingData.tripType || 'one-way',
        returnDate: normalizeDateValue(bookingData.returnDate || ''),
        returnFlightName: bookingData.returnFlightName || '',
        returnFlightNo: bookingData.returnFlightNo || '',
        returnDepartureTime: bookingData.returnDepartureTime || '',
        returnArrivalTime: bookingData.returnArrivalTime || '',
        returnDepartureDate: normalizeDateValue(bookingData.returnDepartureDate || ''),
        returnArrivalDate: normalizeDateValue(bookingData.returnArrivalDate || ''),
        duration: bookingData.duration || '',
        stops: bookingData.stops || 0,
        cabinClass: bookingData.cabinClass || 'Economy',
        passengers: normalizedPassengers,
        seats,
        returnSeats: Array.isArray(bookingData.returnSeats) ? normalizeSeats(bookingData.returnSeats) : [],
        amount: bookingData.amount || 0,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'confirmed',
        dataSource: bookingData.dataSource || 'fallback',
      });

      try {
        await booking.save();
      } catch (saveError) {
        if (saveError?.code === 11000) {
          return res.status(409).json({ success: false, message: 'One or more selected seats were just booked. Please choose different seats.' });
        }
        throw saveError;
      }
      savedBooking = booking;

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
      booking: savedBooking ? { id: savedBooking._id } : null,
    });
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ message: 'Payment verification failed.' });
  }
});

module.exports = router;
