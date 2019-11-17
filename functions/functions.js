// ------ REQUIRE ------
const config = require('../config');
const formatLinkHeader = require('format-link-header');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY || 'tripadvisor';
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// ------ MODELS ------
const Place = require('../models/places');
const Comment = require('../models/comments');

// ------ FUNCTIONS ------
/**
 * AUTHENTICATE
 * This function is used to manage authentication.
 * Thus, when used with a "route", it is not possible to perform it if the user's token has not been registered.
 * There is an error message when the user isn't authentified
 * There is an error message when the token isn't a Bearer token
 * There is an error message when the token isn't valid or expired
 */
exports.authenticate = function(req, res, next) {
    // Ensure the header is present.
    const authorization = req.get('Authorization');
    if (!authorization) {
        return res.status(401).send('Authorization header is missing. You must be authenticated');
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
};

/**
 * QUERY
 * Returns a Mongoose query that will retrieve comments filtered with the URL query parameters.
 */
exports.queryComments = function(req) {
    let query = Comment.find();

    // Will allow to count the number of comments for each place
    query = query.where('placeId').equals(req.params.id);

    if (!isNaN(req.query.rating)) {
        query = query.where('rating').equals(req.query.rating);
    }

    if (!isNaN(req.query.ratedAtMost)) {
        query = query.where('rating').gte(req.query.ratedAtMost);
    }

    if (!isNaN(req.query.ratedAtLeast)) {
        query = query.where('rating').lte(req.query.ratedAtLeast);
    }

    return query;
};

// -- PAGINATION --
/**
 * Responds with 415 Unsupported Media Type if the request does not have the Content-Type application/json.
 */
exports.requireJson = function(req, res, next) {
    if (req.is('application/json')) {
        return next();
    }

    const error = new Error('This resource only has an application/json representation');
    error.status = 415; // 415 Unsupported Media Type
    next(error);
};

/**
 * Parses the pagination parameters (i.e. page & page size) from the request.
 *
 * @param {ExpressRequest} req - The Express request object
 * @returns An object with "page" and "pageSize" properties
 */
exports.getPaginationParameters = function(req) {

    // Parse the "page" URL query parameter indicating the index of the first element that should be in the response
    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1) {
        page = 1;
    }

    // Parse the "pageSize" URL query parameter indicating how many elements should be in the response
    let pageSize = parseInt(req.query.pageSize, 10);
    if (isNaN(pageSize) || pageSize < 0 || pageSize > 100) {
        pageSize = 100;
    }

    return { page, pageSize };
};

/**
 * Adds a Link header to the response (if applicable).
 *
 * @param {String} resourceHref - The hyperlink reference of the collection (e.g. "/api/people")
 * @param {Number} page - The page being listed
 * @param {Number} pageSize - The page size
 * @param {Number} total - The total number of elements
 * @param {ExpressResponse} res - The Exprss response object
 */
exports.addLinkHeader = function(resourceHref, page, pageSize, total, res) {

    const links = {};
    const url = config.baseUrl + resourceHref;
    const maxPage = Math.ceil(total / pageSize);

    // Add first & prev links if current page is not the first one
    if (page > 1) {
        links.first = { rel: 'first', url: `${url}?page=1&pageSize=${pageSize}` };
        links.prev = { rel: 'prev', url: `${url}?page=${page - 1}&pageSize=${pageSize}` };
    }

    // Add next & last links if current page is not the last one
    if (page < maxPage) {
        links.next = { rel: 'next', url: `${url}?page=${page + 1}&pageSize=${pageSize}` };
        links.last = { rel: 'last', url: `${url}?page=${maxPage}&pageSize=${pageSize}` };
    }

    // If there are any links (i.e. if there is more than one page),
    // add the Link header to the response
    if (Object.keys(links).length >= 1) {
        res.set('Link', formatLinkHeader(links));
    }
}

// ------ MIDDLEWARES ------
// -- FUNCTIONS --
/**
 * Display an 404 error if the place or the comment isn't found
 */
function placeNotFound(res, placeId) {
    return res.status(404).type('text').send(`No place found with ID ${placeId}`);
}

function commentNotFound(res, commentId) {
    return res.status(404).type('text').send(`No comment found with ID ${commentId}`);
}

// -- MIDDLEWARES --
exports.loadPlaceFromParamsMiddleware = function(req, res, next) {

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

exports.loadCommentFromParamsMiddleware = function(req, res, next) {

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