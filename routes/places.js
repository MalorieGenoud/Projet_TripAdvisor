const config = require('../config');

var express = require('express');
var router = express.Router();

// ------ Model ------
const Place = require('../models/places');

// ------ Ressources TripAdvisor ------

// GET
router.get('/places', function(req, res, next) {
    // res.send('all places');
    Place.find().sort('creationDate').exec(function(err, users) {
        if (err) {
            return next(err);
        }
        res.send(users);
    });
});

router.get('/places/:id', function(req, res, next) {
    res.send('place\'s profile');
});

router.get('/places/:id/comments', function(req, res, next) {
    res.send('place\'s comments');
});

// POST
router.post('/places', function(req, res, next) {
    //res.send('create places');
    new Place(req.body).save(function(err, savedPlace) {
        if (err) {
            return next(err);
        }

        res
            .status(201)
            .set('Location', `${config.baseUrl}/places/${savedPlace._id}`)
            .send(savedPlace);
    });
});

router.post('/places/:id/comments', function(req, res, next) {
    res.send('create place\'s comments');
});

// PUT
router.put('/places/:id', function(req, res, next) {
    res.send('update place');
});

router.put('/places/:id/comments/:id', function(req, res, next) {
    res.send('update place\'s comment');
});

// DELETE
router.delete('/places/:id', function(req, res, next) {
    res.send('delete place');
});

router.delete('/places/:id/comments/:id', function(req, res, next) {
    res.send('delete place\'s comment');
});

module.exports = router;
