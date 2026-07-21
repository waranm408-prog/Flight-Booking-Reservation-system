var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var { sendEmail } = require('../utils/brevoEmail');
var User = require('../Models/User');
var router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'FBR_SECRET_KEY';

function createToken(user) {
  const role = user.role || (user.email && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase() ? 'admin' : 'user');
  return jwt.sign(
    { id: user._id || user.id || user.email, email: user.email, name: user.name, role },
    JWT_SECRET,
    { expiresIn: '5678d' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing authentication token' });

  jwt.verify(token, JWT_SECRET, function (err, decoded) {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

function isEmailConfigured() {
  var apiKey = process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim();
  var from = process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim();
  return Boolean(apiKey && from);
}

async function sendOtpEmail(email, otp) {
  if (!isEmailConfigured()) {
    console.log(`Password reset OTP for ${email}: ${otp}`);
    console.log('Configure BREVO_API_KEY and EMAIL_FROM in backend/.env to send OTP emails.');
    return { ok: true, fallback: true };
  }

  try {
    await sendEmail({
      to: email,
      subject: 'Password reset OTP',
      html: `<p>Your password reset OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
      senderName: 'SkyElite Support',
      senderEmail: process.env.EMAIL_FROM,
    });
    console.log(`OTP email sent successfully to ${email}`);
    return { ok: true, fallback: false };
  } catch (error) {
    const errorMsg = error?.message || String(error);
    console.error('Failed to send OTP email via Brevo:', errorMsg);
    console.log(`OTP fallback for ${email}: ${otp}`);
    return { ok: false, fallback: true, error: errorMsg };
  }
}

router.post('/signup', async function (req, res) {
  try {
    var { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    var existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    var hashedPassword = await bcrypt.hash(password, 10);
    var user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      authorizedAccess: true,
    });
    await user.save();

    var token = createToken(user);
    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to register user.' });
  }
});

router.post('/login', async function (req, res) {
  try {
    var { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    var normalizedEmail = email.toLowerCase().trim();
    var adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    var adminPassword = (process.env.ADMIN_PASSWORD || '').trim();

    if (normalizedEmail === adminEmail && password === adminPassword) {
      var adminUser = { id: 'admin', name: 'Admin', email: adminEmail, role: 'admin' };
      var token = createToken(adminUser);
      return res.json({
        message: 'Login successful',
        user: adminUser,
        token,
      });
    }

    var user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    var isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    user.lastLoginAt = new Date();
    user.loginHistory.push({
      loggedInAt: new Date(),
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      role: 'user',
    });
    await user.save();

    var token = createToken(user);
    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role || 'user' },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to login user.' });
  }
});

router.post('/forgot-password', async function (req, res) {
  try {
    var { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    var user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email.' });
    }

    var otp = crypto.randomInt(100000, 999999).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    var emailResult = await sendOtpEmail(user.email, otp);

    if (emailResult && emailResult.ok && emailResult.fallback) {
      return res.json({
        message: `OTP generated successfully for ${user.email}. Please use the OTP shown in the server console or verify your email provider configuration.`,
      });
    }

    if (emailResult && !emailResult.ok && emailResult.fallback) {
      return res.json({
        message: `OTP generated successfully for ${user.email}. The email could not be delivered right now, but the OTP is active for this session.`,
      });
    }

    res.json({ message: `OTP sent successfully to ${user.email}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
});

router.post('/verify-otp', async function (req, res) {
  try {
    var { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    var user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: 'No OTP was generated for this account.' });
    }

    if (user.resetOtp !== otp || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    res.json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify OTP.' });
  }
});

router.post('/reset-password', async function (req, res) {
  try {
    var { email, otp, newPassword, confirmPassword } = req.body;
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    var user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: 'No valid reset session was found.' });
    }

    if (user.resetOtp !== otp || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
});

router.get('/profile', authenticateToken, async function (req, res) {
  try {
    var user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load profile.' });
  }
});

router.put('/profile', authenticateToken, async function (req, res) {
  try {
    var { name, address, passportNumber } = req.body;
    var update = {};
    if (name !== undefined) update.name = name.trim();
    if (address !== undefined) update.address = address.trim();
    if (passportNumber !== undefined) update.passportNumber = passportNumber.trim();

    var user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

module.exports = router;
