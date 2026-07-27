var mongoose = require('mongoose');

var bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userEmail: { type: String, trim: true, default: '' },
  flightId: { type: String, trim: true, default: null },
  // For round-trip bookings: return-flight id (flid) and flag
  flid: { type: String, trim: true, default: null },
  isRoundTrip: { type: Boolean, default: false },
  tripType: { type: String, enum: ['one-way', 'round-trip'], default: 'one-way' },
  flightName: { type: String, required: true, trim: true },
  origin: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  departureTime: { type: String, default: '' },
  arrivalTime: { type: String, default: '' },
  cabinClass: { type: String, default: 'Economy' },
  
  // Flight details (from live API)
  flightNo: { type: String, trim: true, default: '' },
  airline: { type: String, trim: true, default: '' },
  departureDate: { type: Date, default: null },
  arrivalDate: { type: Date, default: null },
  returnDate: { type: Date, default: null },
  returnFlightName: { type: String, trim: true, default: '' },
  returnFlightNo: { type: String, trim: true, default: '' },
  returnDepartureTime: { type: String, default: '' },
  returnArrivalTime: { type: String, default: '' },
  returnDepartureDate: { type: Date, default: null },
  returnArrivalDate: { type: Date, default: null },
  duration: { type: String, default: '' },
  stops: { type: Number, default: 0 },
  
  passengers: [{
    name: { type: String, trim: true, default: '' },
    phone: { type: Number, default: null },
    email: { type: String, trim: true, default: '' },
  }],
  seats: [{ type: String }],
  returnSeats: [{ type: String }],
  amount: { type: Number, required: true },
  paymentId: { type: String, default: '' },
  orderId: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  dataSource: { type: String, default: 'live', enum: ['live'] },
}, {
  timestamps: true,
});

bookingSchema.index(
  { flightId: 1, flid: 1, seats: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [
        { flightId: { $type: 'string' } },
        { flid: { $type: 'string' } }
      ]
    }
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
