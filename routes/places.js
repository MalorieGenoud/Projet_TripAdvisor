// ------ REQUIRE ------
const config = require('../config');
const express = require('express');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const router = express.Router();

// ------ FUNCTIONS AND MIDDLEWARES ------
const func = require('../functions/functions')

// ------ WEBSOCKET ------
const webSocket = require('../websocket/dispatcher');

// ------ MODELS ------
const Place = require('../models/places');
const Comment = require('../models/comments');

// ------ RESOURCES TRIPADVISOR ------
/**
 * Show all places
 * Add a aggregation to count comments for a place
 * Example : http://localhost:3000/places
 * Pagination
 * Example : http://localhost:3000/places?pageSize=3
 */
router.get('/places', function (req, res, next) {
    Place.find().count(function (err, total) {
        if (err) {
            return next(err);
        }

        // Parse pagination parameters from URL query parameters
        const { page, pageSize } = func.getPaginationParameters(req);

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
                    geolocation: { $first: '$geolocation' },
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

            // Add the Link header to the response
            func.addLinkHeader('/places', page, pageSize, total, res);

            // Websocket
            const nbPlaces = places.length;
            webSocket.nbPlaces(nbPlaces);

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

/**
 * Show a place with specific id
 * Example : http://localhost:3000/places/1
 */
router.get('/places/:id', func.loadPlaceFromParamsMiddleware, function (req, res, next) {
    res.send(req.place);
});

/**
 * Show all comments for a specific place and count total comment matching the URL query parameters
 * Example : http://localhost:3000/places/1/comments
 */
router.get('/places/:id/comments', function (req, res, next) {
    // Count total comment matching the URL query parameters
    const countQuery = func.queryComments(req);
    countQuery.count(function (err, total) {
        if (err) {
            return next(err);
        }

        // Prepare the initial database query from the URL query parameters
        let query = func.queryComments(req);

        query.exec(function (err, comments) {
            if (err) {
                return next(err);
            }

            // Websocket
            const nbComments = comments.length;
            webSocket.nbComments(nbComments);

            res.send(comments);
        });
    });
});

// -- POST --
/**
 * Create a place
 * Example : http://localhost:3000/places
 * Example body for Postman :
  {
       "description": "First place",
       "geolocation":
       {
            "type": "Point",
            "coordinates": [ -73.856077, 40.848447 ]
       },
        "picture": "https://webassets.mongodb.com/_com_assets/cms/MongoDB_Logo_FullColorBlack_RGB-4td3yuxzjs.png"
  }
 */
router.post('/places', func.authenticate, function (req, res, next) {
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

/**
 * Create a comment for a specific place
 * Example : http://localhost:3000/places/1/comments
 * Example body for Postman :
  {
        "rating": "10",
        "description": "The first comment for this place",
        "placeId": "5dcd1439c765493dc4753225",
        "userId": "5dcd105be779eb461454319a"
  }
 */
router.post('/places/:id/comments', func.authenticate, function (req, res, next) {
    // Recover the place's id
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
/**
 * Update a place
 * Example : http://localhost:3000/places
 * Example body for Postman :
 {
       "description": "First place updated",
       "geolocation":
       {
            "type": "Point",
            "coordinates": [ -73.856077, 40.848447 ]
       },
        "picture": "https://webassets.mongodb.com/_com_assets/cms/MongoDB_Logo_FullColorBlack_RGB-4td3yuxzjs.png"
  }
 */
router.put('/places/:id', func.authenticate, func.requireJson, func.loadPlaceFromParamsMiddleware, function (req, res, next) {
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

/**
 * Update a specific comment for a specific place
 * Example : http://localhost:3000/places/1/comments/1
 * Example body for Postman :
  {
        "rating": "10",
        "description": "The first comment for this place updated",
        "placeId": "5dcd1439c765493dc4753225",
        "userId": "5dcd105be779eb461454319a"
  }
 */
router.put('/places/:idPlace/comments/:id', func.authenticate, func.requireJson, func.loadCommentFromParamsMiddleware, function (req, res, next) {
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
/**
 * Delete a place
 * Example : http://localhost:3000/places/1
 */
router.delete('/places/:id', func.authenticate, function (req, res, next) {
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

/**
 * Delete a specific comment for a specific place
 * Example : http://localhost:3000/places/1/comments/1
 */
router.delete('/places/:idPlace/comments/:id', func.authenticate, function (req, res, next) {
    Comment.findByIdAndRemove(req.params.id, req.body, function (err, post) {
        if (err) {
            return next(err);
        }
        res.sendStatus(204);
    });
});

module.exports = router;