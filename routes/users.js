// ------ REQUIRE ------
const config = require('../config');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ------ FUNCTIONS AND MIDDLEWARES ------
const func = require('../functions/functions');

// ------ WEBSOCKET ------
const webSocket = require('../websocket/dispatcher');

// ------ MODELS ------
const User = require('../models/users');
const Comment = require('../models/comments');

// ------ RESOURCES TRIPADVISOR ------
/**
 * GET
 * Show all users
 * Example URL: http://localhost:3000/users
 */
router.get('/users', function(req, res, next) {
    User.find().exec(function(err, users) {
        if (err) {
            return next(err);
        }

        // Websocket
        const nbUsers = users.length;
        webSocket.nbUsers(nbUsers);

        res.send(users);
    });
});

/**
 * POST
 * Create a user
 * Example URL : http://localhost:3000/users
 * Example body : {"username": "toto", "password": "123456"}
 */
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

/**
 * POST
 * Connexion with a user's credential
 * Example URL : http://localhost:3000/users/login
 */
router.post('/users/login', function(req, res, next) {
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
        });

        // Generate a valid JWT which expires in 7 days.
        const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;
        const claims = { sub: user._id.toString(), exp: exp };
        jwt.sign(claims, config.secretKey, function(err, token) {
            if (err) { return next(err); }
            res.send({ token: token }); // Send the token to the client.
        });
    })
});

/**
 * DELETE
 * Delete a user with a specific id
 * Example : http://localhost:3000/users/1
 */
router.delete('/users/:id', func.authenticate, function(req, res, next) {
    User.findByIdAndRemove(req.params.id, req.body, function (err, post) {
        if (err) {
            return next(err);
        }
        Comment.deleteMany().where('userId').equals(req.params.id).exec(function (err, comments) {
            if (err) {
                return next(err);
            }
            res.sendStatus(204);
        });
    });
});

module.exports = router;