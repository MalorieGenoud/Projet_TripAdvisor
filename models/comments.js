const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

const commentSchema = new mongoose.Schema({
    rating: {
        type: String,
        required: false,
        enum: ['lowest', 'average', 'maximum']
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
    placeId: {
        type: Schema.Types.ObjectId,
        ref: 'Place',
        default: null,
        required: false
    }
})

// Customize the behavior of user.toJSON() (called when using res.send)
commentSchema.set('toJSON', {
    transform: transformJsonComment, // Modify the serialized JSON with a custom function
    virtuals: true // Include virtual properties when serializing documents to JSON
});


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