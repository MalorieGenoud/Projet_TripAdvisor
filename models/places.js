const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

const placeSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 150,
    },
    geolocation: {
        type: {
                type: String,
                required: true,
                enum: [ 'Point' ]
            },
        coordinates: {
            type: [ Number ],
            required: true,
            // Va permettre de valider le format qu'on lui mets
            validate: {
                validator: validateGeoJsonCoordinates,
                message: '{VALUE} is not a valid longitude/latitude(/altitude) coordinates array'
            }
        }
    },
    picture: {
        type: String,
        required: true
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
    }
})

// Create a geospatial index on the location property.
placeSchema.index({ location: '2dsphere' });

// Customize the behavior of user.toJSON() (called when using res.send)
placeSchema.set('toJSON', {
    transform: transformJsonPlace, // Modify the serialized JSON with a custom function
    virtuals: true // Include virtual properties when serializing documents to JSON
});

// Validate a GeoJSON coordinates array (longitude, latitude and optional altitude).
function validateGeoJsonCoordinates(value) {
    return Array.isArray(value) && value.length >= 2 && value.length <= 3 && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90;
}

/**
 * Removes extra MongoDB properties from serialized users.
 */
function transformJsonPlace(doc, json, options) {

    // Remove MongoDB _id & __v (there's a default virtual "id" property)
    delete json._id;
    delete json.__v;

    return json;
}

module.exports = mongoose.model('Places', placeSchema);