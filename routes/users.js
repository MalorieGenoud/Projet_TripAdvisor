
const config = require('../config');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var express = require('express');
var router = express.Router();

// ------ WEBSOCKET ------
const webSocket = require('../dispatcher');

// ------ Model ------
const User = require('../models/users');
const Comment = require('../models/comments');

// ------ Ressources TripAdvisor ------

//Fonction authenticate
function authenticate(req, res, next) {
    // Ensure the header is present.
    const authorization = req.get('Authorization');
    if (!authorization) {
        return res.status(401).send('Authorization header is missing');
    }
    // Check that the header has the correct format.
    const match = authorization.match(/^Bearer (.+)$/);
    if (!match) {
        return res.status(401).send('Authorization header is not a bearer token');
    }
    // Extract and verify the JWT.
    const token = match[1];
    jwt.verify(token, config.secretKey, function(err, payload) {
        if (err) {
            return res.status(401).send('Your token is invalid or has expired');
        } else {
            req.currentUserId = payload.sub;
            next(); // Pass the ID of the authenticated user to the next middleware.
        }
    });
}

// GET
router.get('/users', function(req, res, next) {
    User.find().sort('username').exec(function(err, users) {
        if (err) {
            return next(err);
        }

        const nbUsers = users.length;

        webSocket.nbUsers(nbUsers);

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
        jwt.sign(claims, config.secretKey, function(err, token) {
            if (err) { return next(err); }
            res.send({ token: token }); // Send the token to the client.
        });
    })
});

// PUT
/*
router.put('/users/:id', authenticate, function(req, res, next) {
  res.send('update user\'s profile');
});
*/

// DELETE
router.delete('/users/:id', authenticate, function(req, res, next) {
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
