// ------ REQUIRE ------
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ------ SCHEMA ------
/**
 * Create schema for table comments
 */
const commentSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 0,
        max: 10
    },
    description: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 150,
    },
    picture: {
        type: String,
        required: false
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastModifDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    // Foreign keys
    placeId: {
        type: Schema.Types.ObjectId,
        ref: 'Place',
        default: null,
        required: false
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        required: false
    }
});

// Customize the behavior of user.toJSON() (called when using res.send)
commentSchema.set('toJSON', {
    transform: transformJsonComment, // Modify the serialized JSON with a custom function
    virtuals: true // Include virtual properties when serializing documents to JSON
});

// ------ FUNCTIONS ------
/**
 * Removes extra MongoDB properties from serialized users.
 */
function transformJsonComment(doc, json, options) {

    // Remove MongoDB _id & __v (there's a default virtual "id" property)
    delete json._id;
    delete json.__v;

    return json;
}

module.exports = mongoose.model('Comments', commentSchema);