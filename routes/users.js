const config = require('../config');

var express = require('express');
var router = express.Router();

// ------ Model ------
const User = require('../models/users');

// ------ Ressources TripAdvisor ------

// GET
router.get('/users', function(req, res, next) {
  User.find().sort('username').exec(function(err, users) {
    if (err) {
      return next(err);
    }
    res.send(users);
  });
});

// POST
router.post('/users', function(req, res, next) {
  new User(req.body).save(function(err, savedUser) {
    if (err) {
      return next(err);
    }

      res
      .status(201)
      .set('Location', `${config.baseUrl}/users/${savedUser._id}`)
      .send(savedUser);
  });
});

// PUT
/*
router.put('/users/:id', function(req, res, next) {
  res.send('update user\'s profile');
});
*/

// DELETE
/*
router.delete('/users/:id', function(req, res, next) {
  res.send('delete user');
});
*/

module.exports = router;
