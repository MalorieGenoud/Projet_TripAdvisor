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

// -- GET --
// ALL PLACES
router.get('/places', function (req, res, next) {
    Place.find().count(function (err, total) {
        if (err) {
            return next(err);
        }

        let query = Place.find();

        // Parse pagination parameters from URL query parameters
        const { page, pageSize } = utils.getPaginationParameters(req);

        // Apply the pagination to the database query
        query = query.skip((page - 1) * pageSize).limit(pageSize);

        // Add the Link header to the response
        utils.addLinkHeader('/places', page, pageSize, total, res);

        // Execute the query
        query.exec(function (err, movies) {
            if (err) {
                return next(err);
            }

            res.send(movies);
        });
    });
});

// ONE PLACE
router.get('/places/:id', loadPlaceFromParamsMiddleware, function (req, res, next) {
    countPlacesBy(req.place, function (err, places) {
        if (err) {
            return next(err);
        }

        res.send({
            ...req.place.toJSON(),
            places
        });
    });
});

// ALL PLACE'S COMMENTS
router.get('/places/:id/comments', function (req, res, next) {
    // Count total comment matching the URL query parameters
    const countQuery = queryComments(req);
    countQuery.count(function (err, total) {
        if (err) {
            return next(err);
        }

        // Prepare the initial database query from the URL query parameters
        let query = queryComments(req);

        query.exec(function (err, comments) {
            if (err) {
                return next(err);
            }
            res.send(comments);

        });
    });
});
// -- POST --
// CREATE ONE PLACE
router.post('/places', function (req, res, next) {
    new Place(req.body).save(function (err, savedPlace) {
        if (err) {
            return next(err);
        }

        res
            .status(201)
            .set('Location', `${config.baseUrl}/places/${savedPlace._id}`)
            .send(savedPlace);
    });
});

// CREATE ONE PLACE'S COMMENT
router.post('/places/:id/comments', function (req, res, next) {
    const comment = req.body;
    comment.placeId = req.params.id;

    new Comment(comment).save(function (err, savedComment) {
        if (err) {
            return next(err);
        }

        res
            .status(201)
            .set('Location', `${config.baseUrl}/places/:id/${savedComment._id}`)
            .send(savedComment);
    });
});

// -- PUT --
// UPDATE ONE PLACE
router.put('/places/:id', utils.requireJson, loadPlaceFromParamsMiddleware, function (req, res, next) {
    // Update all properties
    req.place.type = req.body.type;
    req.place.geolocation = req.body.geolocation;
    req.place.description = req.body.description;
    req.place.picture = req.body.picture;
    req.place.lastModifDate = Date.now();

    req.place.save(function (err, savedPlace) {
        if (err) {
            return next(err);
        }
        res.send(savedPlace);
    });
});

// UPDATE ONE COMMENT
router.put('/places/:idPlace/comments/:id', utils.requireJson, loadCommentFromParamsMiddleware, function (req, res, next) {
    // Update all properties
    req.comment.description = req.body.description;
    req.comment.picture = req.body.picture;
    req.comment.lastModifDate = Date.now();

    req.comment.save(function (err, savedComment) {
        if (err) {
            return next(err);
        }
        res.send(savedComment);
    });
});

// -- DELETE --
// DELETE ONE PLACE
router.delete('/places/:id', function (req, res, next) {
    Place.findByIdAndRemove(req.params.id, req.body, function (err, post) {
        if (err) {
            return next(err);
        }
        Comment.deleteMany().where('placeId').equals(req.params.id).exec(function (err, comments) {
            if (err) {
                return next(err);
            }
            res.sendStatus(204);
        });
    });
});

// DELETE ONE PLACE AND PLACE'S COMMENTS
router.delete('/places/:idPlace/comments/:id', function (req, res, next) {
    Comment.findByIdAndRemove(req.params.id, req.body, function (err, post) {
        if (err) {
            return next(err);
        }
        res.sendStatus(204);
    });

});

// ------ FUNCTIONS ------
/**
 * Responds with 404 Not Found and a message indicating that the place with the specified ID was not found.
 */
function placeNotFound(res, placeId) {
    return res.status(404).type('text').send(`No place found with ID ${placeId}`);
}

function commentNotFound(res, commentId) {
    return res.status(404).type('text').send(`No comment found with ID ${commentId}`);
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

    Place.findById(req.params.id, function (err, place) {
        if (err) {
            return next(err);
        } else if (!place) {
            return placeNotFound(res, placeId);
        }

        req.place = place;
        next();
    });
}

function loadCommentFromParamsMiddleware(req, res, next) {

    const commentId = req.params.id;
    if (!ObjectId.isValid(commentId)) {
        return commentNotFound(res, commentId);
    }

    Comment.findById(req.params.id, function (err, comment) {
        if (err) {
            return next(err);
        } else if (!comment) {
            return commentNotFound(res, commentId);
        }

        req.comment = comment;
        next();
    });
}

/**
 * Returns a Mongoose query that will retrieve comments filtered with the URL query parameters.
 */
function queryComments(req) {

    let query = Comment.find();

    if (Array.isArray(req.query.placeId)) {
        const places = req.query.placeId.filter(ObjectId.isValid);
        query = query.where('placeId').in(places);
    } else if (ObjectId.isValid(req.query.placeId)) {
        query = query.where('placeId').equals(req.query.placeId);
    }

    if (!isNaN(req.query.rating)) {
        query = query.where('rating').equals(req.query.rating);
    }

    if (!isNaN(req.query.ratedAtLeast)) {
        query = query.where('rating').gte(req.query.ratedAtLeast);
    }

    if (!isNaN(req.query.ratedAtMost)) {
        query = query.where('rating').lte(req.query.ratedAtMost);
    }

    return query;
}

module.exports = router;