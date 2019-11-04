var express = require('express');
var router = express.Router();

// ------ Model ------
const User = require('../models/users');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// ------ Ressources TripAdvisor ------

// GET
/*
router.get('/users/:id', function(req, res, next) {
  res.send('user\'s profile');
});
*/

// POST
router.post('/users', function(req, res, next) {
  // res.send('create user');

  // Create a new document from the JSON in the request body
  const user = new User(req.body);

  // Save that document
  user.save(function (err, savedUser) {
      if (err) {
          return next(err);
      }
      // Send the saved document in the response
      res.send(savedUser);
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
