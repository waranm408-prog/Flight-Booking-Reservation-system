var jwt = require('jsonwebtoken');
var User = require('./models/User');

module.exports = async function auth(req, res, next) {
  try {
    var authHeader = req.headers.authorization;
    var token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies && req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    var decoded = jwt.verify(token, process.env.JWT_SECRET || 'fbr-secret');
    var user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
