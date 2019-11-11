var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('jsonwebtoken');


// All routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const placesRouter = require('./routes/places');

var app = express();

// mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/tripadvisor', {
    useNewUrlParser:true, useUnifiedTopology: true
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/', placesRouter);

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

//jsonwebtoken
/*
const secretKey = process.env.SECRET_KEY || 'secret';
const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;

// Create and sign a token.
jwt.sign({ sub: 'Karim Rochat', exp: exp }, secretKey, function(err, token) {
  secretKey
});
jwt.verify(token, secretKey, function(err, payload) {
  secretKey
});
*/
module.exports = app;