const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 15,
        unique: true,
        validate:
        // Manually validate uniqueness to send a "pretty" validation error
        // rather than a MongoDB duplicate key error
            [{
                validator: validateUsernameUniqueness,
                message:'Username {VALUE} already exists'
            }],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 20,
    },
    registrationDate: {
        type: Date,
        required: true,
        default: Date.now
    }
})

// Customize the behavior of user.toJSON() (called when using res.send)
userSchema.set('toJSON', {
    transform: transformJsonUser, // Modify the serialized JSON with a custom function
    virtuals: true // Include virtual properties when serializing documents to JSON
});

/**
 * Given a name, calls the callback function with true if no user exists with that name
 * (or the only person that exists is the same as the person being validated).
 */
function validateUsernameUniqueness(value) {
    return this.constructor.findOne().where('username').equals(value).exec().then((existingUser) => {
        return !existingUser || existingUser._id.equals(this._id);
    });
}

/**
 * Removes extra MongoDB properties from serialized users.
 */
function transformJsonUser(doc, json, options) {

    // Remove MongoDB _id & __v (there's a default virtual "id" property)
    delete json._id;
    delete json.__v;

    return json;
}

module.exports = mongoose.model('Users', userSchema);