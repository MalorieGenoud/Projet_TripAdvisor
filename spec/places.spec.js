const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../app');
const Place = require('../models/places');
const User = require('../models/users');
const Comment = require('../models/comments');
const mongoose = require('mongoose');
const { cleanUpDatabasePlace } = require('./utils');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY || 'tripadvisor';
var config = require('../config');
var express = require('express');
const router = express.Router();

beforeEach(cleanUpDatabasePlace);

describe('PUT /places', function() {
    var user;
    var place;
    beforeEach(async function() {
        user = await User.create({ username: 'Karim Rochat', password: '123456' });
        place = await Place.create({description: 'Place générée à chaque test', geolocation: {type: "Point", coordinates: [ -70, 50 ]}, picture: "https://webassets.mongodb.com/_com_assets/cms/MongoDB_Logo_FullColorBlack_RGB-4td3yuxzjs.png"})
    });

    it('should not update a place if not authenticated', async function() {
        const res = await supertest(app)
        .put('/places/'+ place._id)
        .expect(401);
    });

    it('should update a place', async function() {
        const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;
        const claims = {sub: user._id.toString(), exp: exp};
        const token = jwt.sign(claims, config.secretKey);

        const res = await supertest(app)
        const req = await supertest(app)
        .put('/places/'+ place._id)
        .send({
            description: "Description updated",
            geolocation: {
                type: "Point",
                coordinates: [-50, 50]
            },
            picture: "https://fotomelia.com/wp-content/uploads/edd/2015/03/maison-ic%C3%B4ne-1560x1518.png"
        })
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)

        //expect(req.body).to.be.an('object')
        //expect(req.description).to.be.a('string')
        //expect(req.geolocation[0]).to.be.a('string')
        //expect(req.geolocation[1]).to.be.a('number')
        //expect(req.picture).to.be.an('uri')
        //expect(req.body).to.have.all.keys('description', 'geolocation', 'picture');
        });
});


describe('DELETE /places', function() {
    var user;
    var place;
    var comment;
    beforeEach(async function() {
        user = await User.create({ username: 'Karim Rochat', password: '123456' });
        place = await Place.create({description: 'Place générée à chaque test', geolocation: {type: "Point", coordinates: [ -70, 50 ]}, picture: "https://webassets.mongodb.com/_com_assets/cms/MongoDB_Logo_FullColorBlack_RGB-4td3yuxzjs.png"});
        comment = await Comment.create({rating: 5, description: 'Une description de test'})
    });

    it('should not delete a place if not authenticated', async function() {
        const res = await supertest(app)
        .delete('/places/'+ place._id)
        .expect(401);
    });

    it('should delete a place', async function() {
        const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;
        const claims = {sub: user._id.toString(), exp: exp};
        const token = jwt.sign(claims, config.secretKey);

        const res = await supertest(app)
        .delete('/places/'+ place._id)
        .set('Authorization', 'Bearer ' + token)
        .expect(204)
        });
});

after(mongoose.disconnect);