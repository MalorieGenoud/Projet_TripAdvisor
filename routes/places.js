const config = require('../config');
const express = require('express');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const utils = require('./utils');

const router = express.Router();

// ------ Model ------
const Place = require('../models/places');
const Comment = require('../models/comments');

// ------ Ressources TripAdvisor ------

// GET
router.get('/places', function(req, res, next) {
    Place.find().exec(function(err, places) {
        if (err) {
            return next(err);
        }
        res.send(places);
    });
});

router.get('/places/:id', loadPlaceFromParamsMiddleware, function(req, res, next) {
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
    Comment.find().where('placeId').equals(req.params.id).exec(function(err, comments) {
        if (err) {
            return next(err);
        }
        res.send(comments);
    });
});

// POST
router.post('/places', function(req, res, next) {
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
    const comment = req.body;
    comment.placeId = req.params.id;

    new Comment(comment).save(function(err, savedComment) {
        if (err) {
            return next(err);
        }

        res
            .status(201)
            .set('Location', `${config.baseUrl}/places/:id/${savedComment._id}`)
            .send(savedComment);
    });
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
    Place.findByIdAndRemove(req.params.id, req.body, function (err, post) {
        if (err) {
            return next(err);
        }
        res.sendStatus(204);
    });
   });

router.delete('/places/:id/comments/:id', function(req, res, next) {
    res.send('delete place\'s comment');
});

// ------ FUNCTIONS ------
/**
 * Responds with 404 Not Found and a message indicating that the place with the specified ID was not found.
 */
function placeNotFound(res, placeId) {
    return res.status(404).type('text').send(`No place found with ID ${placeId}`);
}

/**
 * Given a person, asynchronously returns the number of movies directed by the person.
 */
function countPlacesBy(place, callback) {
    Place.countDocuments().where('placeId', place._id).exec(callback);
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