const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
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

// Validate a GeoJSON coordinates array (longitude, latitude and optional altitude).
function validateGeoJsonCoordinates(value) {
    return Array.isArray(value) && value.length >= 2 && value.length <= 3 && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90;
}

module.exports = mongoose.model('Places', placeSchema);