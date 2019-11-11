const config = require('../config');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
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
    const plainPassword = req.body.password;
    const saltRounds = 10;
    bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
        if (err) {
            return next(err);
        }
        const newUser = new User(req.body);
        newUser.password = hashedPassword;
        newUser.save(function(err, savedUser) {
            if (err) {
                return next(err);
            }
            res.send(savedUser);
        });
    });
});

router.post('/login', function(req, res, next) {
    User.findOne({ username: req.body.username }).exec(function(err, user) {
        if (err) {
            return next(err);
        } else if (!user) {
            return res.sendStatus(401);
        }
        bcrypt.compare(req.body.password, user.password, function(err, valid) {
            if (err) {
                return next(err);
            } else if (!valid) {
                return res.sendStatus(401);
            }
            res.send(`Welcome ${user.username}!`);
        });

        // Generate a valid JWT which expires in 7 days.
        const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;
        const claims = { sub: user._id.toString(), exp: exp };
        jwt.sign(claims, secretKey, function(err, token) {
            if (err) { return next(err); }
            res.send({ token: token }); // Send the token to the client.
        });
    })
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
