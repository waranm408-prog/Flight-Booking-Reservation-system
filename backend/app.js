var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mongoose = require('mongoose');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var flightsRouter = require('./routes/flights');
var paymentsRouter = require('./routes/payments');
var bookingsRouter = require('./routes/bookings');
var adminRouter = require('./routes/admin');

var app = express();

mongoose.connect(process.env.MONGO_URI );

mongoose.connection.on('connected', function () {
  console.log('MongoDB connected to', process.env.MONGO_URI );
});

mongoose.connection.on('error', function (err) {
  console.error('MongoDB connection error:', err);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors({ origin: [process.env.Cors_ORIGIN], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/flights', flightsRouter);
app.use('/payments', paymentsRouter);
app.use('/bookings', bookingsRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
