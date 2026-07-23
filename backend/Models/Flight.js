var mongoose = require('mongoose');

var flightSchema = new mongoose.Schema({
    flightNo: {
        type: String, required: true,
        unique: true, trim: true
    },
    airline: {
        type: String, required: true,
        trim: true
    },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    departureDate: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    stops: { type: Number, default: 0 },
    price: { type: String, required: true, trim: true },
    cabinClass: { type: String, default: 'Economy', trim: true },
    logo: { type: String, default: '' },
    seatsAvailable: { type: Number, default: 0 },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Flight', flightSchema);
