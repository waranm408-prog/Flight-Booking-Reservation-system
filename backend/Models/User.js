var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  address: { type: String, default: '' },
  passportNumber: { type: String, default: '' },
  authorizedAccess: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
  loginHistory: [{
    loggedInAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    role: { type: String, default: 'user' }
  }],
  resetOtp: { type: String, default: '' },
  resetOtpExpires: { type: Date, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
