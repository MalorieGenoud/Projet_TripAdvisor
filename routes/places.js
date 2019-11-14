const config = require('../config');
const express = require('express');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const utils = require('./utils');
const users = require('./users');
var jwt = require('jsonwebtoken');
var secretKey = process.env.SECRET_KEY || 'tripadvisor';
const router = express.Router();

// ------ WEBSOCKET ------
const webSocket = require('../dispatcher');

// ------ Model ------
const Place = require('../models/places');
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
    jwt.verify(token, secretKey, function(err, payload) {
        if (err) {
            return res.status(401).send('Your token is invalid or has expired');
        } else {
            req.currentUserId = payload.sub;
            next(); // Pass the ID of the authenticated user to the next middleware.
        }
    });
}

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

        // Aggregation
        Place.aggregate([
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'placeId',
                    as: 'commentedPlace'
                }
            },
            {
                $unwind:
                {
                    path: "$commentedPlace",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $set: {
                    commentedPlace: {
                    $cond: {
                      if: '$commentedPlace',
                      then: 1,
                      else: 0
                    }
                  }
                }
              },
            {
                $group: {
                    _id: '$_id',
                    description: { $first: '$description' },
                    picture: { $first: '$picture' },
                    createdAt: { $first: '$createdAt' },
                    lastModifDate: { $first: '$lastModifDate' },
                    commentedPlace: { $sum: '$commentedPlace' }
                }
            },
            {
                $sort: {
                    description: 1
                }
            },
            {
                $skip: (page - 1) * pageSize
            },
            {
                $limit: pageSize
            }
        ], (err, places) => {
            if (err) {
                return next(err);
            }
            console.log(places);

            const nbPlaces = places.length;

            webSocket.nbPlaces(nbPlaces);

            // Add the Link header to the response
            utils.addLinkHeader('/places', page, pageSize, total, res);

            res.send(places.map(place => {

                // Transform the aggregated object into a Mongoose model.
                const serialized = new Place(place).toJSON();

                // Add the aggregated property.
                serialized.commentedPlace = place.commentedPlace;

                return serialized;
            }));
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

            const nbComments = comments.length;

            webSocket.nbComments(nbComments);

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