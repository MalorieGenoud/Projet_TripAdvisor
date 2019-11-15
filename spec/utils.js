const User = require('../models/users');
const Place = require('../models/places');
const Comment = require('../models/comments');

exports.cleanUpDatabaseUser = async function() {
    await Promise.all([
        User.deleteMany()
    ]);
};

exports.cleanUpDatabasePlace = async function() {
    await Promise.all([
        Place.deleteMany()
    ]);
};

exports.cleanUpDatabaseComment = async function() {
    await Promise.all([
        Comment.deleteMany()
    ]);
};