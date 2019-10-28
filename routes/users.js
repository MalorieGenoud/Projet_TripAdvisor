var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// ------ Ressources TripAdvisor ------

// GET
router.get('/users/:id', function(req, res, next) {
  res.send('user\'s profile');
});

// POST
router.post('/users', function(req, res, next) {
  res.send('create user');
});

// PUT
router.put('/users/:id', function(req, res, next) {
  res.send('update user\'s profile');
});

// DELETE
router.delete('/users/:id', function(req, res, next) {
  res.send('delete user');
});

module.exports = router;
