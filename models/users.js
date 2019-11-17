// ------ REQUIRE ------
const mongoose = require('mongoose');

// ------ SCHEMA ------
/**
 * Create schema for table users
 */
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 15,
        unique: true,
        validate:
        // Create a validation if the username already exists
        [{
            validator: validateUsernameUniqueness,
            message:'Username {VALUE} already exists'
        }],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 255,
    },
    registrationDate: {
        type: Date,
        required: true,
        default: Date.now
    }
});

/**
 * Customize the behavior of user.toJSON() (called when using res.send)
 */
userSchema.set('toJSON', {
    transform: transformJsonUser, // Modify the serialized JSON with a custom function
    virtuals: true // Include virtual properties when serializing documents to JSON
});


// ------ FUNCTIONS ------
/**
 * If we create a user with the same username as an existing one, there an error message
 * Otherwise there is no error message if it doesn't already exist
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
    delete json.password;
    return json;
}

module.exports = mongoose.model('Users', userSchema);