var mongoose = require('mongoose');

var bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userEmail: { type: String, trim: true, default: '' },
  flightId: { type: String, trim: true, default: null },
  flightName: { type: String, required: true, trim: true },
  origin: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  departureTime: { type: String, default: '' },
  arrivalTime: { type: String, default: '' },
  cabinClass: { type: String, default: 'Economy' },
  passengers: [{
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
  }],
  seats: [{ type: String }],
  amount: { type: Number, required: true },
  paymentId: { type: String, default: '' },
  orderId: { type: String, default: '' },
  status: { type: String, default: 'pending' },
}, {
  timestamps: true,
});

bookingSchema.index(
  { flightId: 1, seats: 1 },
  { unique: true, partialFilterExpression: { flightId: { $type: 'string' } } }
);

module.exports = mongoose.model('Booking', bookingSchema);
