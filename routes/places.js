const config = require('../config');
const express = require('express');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const utils = require('./utils');

const router = express.Router();

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

router.get('/places/:id', loadPlaceFromParamsMiddleware, function(req, res, next) {
    //res.send('place\'s profile');

    countPlacesBy(req.place, function(err, places) {
        if (err) {
            return next(err);
        }

        res.send({
            ...req.place.toJSON(),
            places
        });
    });
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

// ------ FUNCTIONS ------
/**
 * Responds with 404 Not Found and a message indicating that the person with the specified ID was not found.
 */
function placeNotFound(res, placeId) {
    return res.status(404).type('text').send(`No person found with ID ${placeId}`);
}

/**
 * Given a person, asynchronously returns the number of movies directed by the person.
 */
function countPlacesBy(place, callback) {
    Place.countDocuments().where('commentId', place._id).exec(callback);
}

// ------ MIDDLEWARES ------

function loadPlaceFromParamsMiddleware(req, res, next) {

    const placeId = req.params.id;
    if (!ObjectId.isValid(placeId)) {
        return placeNotFound(res, placeId);
    }

    Place.findById(req.params.id, function(err, place) {
        if (err) {
            return next(err);
        } else if (!place) {
            return placeNotFound(res, placeId);
        }

        req.place = place;
        next();
    });
}

module.exports = router;
