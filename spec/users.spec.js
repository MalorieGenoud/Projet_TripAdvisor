// ------ REQUIRE ------
const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { cleanUpDatabaseUser } = require('./utils');
const User = require('../models/users');
const Comment = require('../models/comments');
const jwt = require('jsonwebtoken');
const config = require('../config');
const express = require('express');

beforeEach(cleanUpDatabaseUser);

//TEST POUR GET DES USERS SUR LA ROUTE /USERS
describe('GET /users', function() {

    beforeEach(async function() {
        await Promise.all([
            User.create({ username: 'Prisca', password: '123456789' }),
            User.create({ username: 'Malorie', password: '987654321' }),
            User.create({ username: 'Karim', password: '135792468' })
        ]);
    }); 

    it('should retrieve 3 users ordered by ascending name', async function() {
        const res = await supertest(app)
        .get('/users')
        .expect(200)
        .expect('Content-Type', /json/);

        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(3)

        expect(res.body[0]).to.be.an('object')
        expect(res.body[0].id).to.be.a('string')
        expect(res.body[0].username).to.equal('Karim')
        expect(res.body[0].username).to.be.a('string')
        expect(res.body[0].registrationDate).to.be.a('string')
        expect(res.body[0]).to.have.all.keys('id', 'username', 'registrationDate')

        expect(res.body[1]).to.be.an('object')
        expect(res.body[1].id).to.be.a('string')
        expect(res.body[1].username).to.equal('Malorie')
        expect(res.body[1].username).to.be.a('string')
        expect(res.body[1].registrationDate).to.be.a('string')
        expect(res.body[1]).to.have.all.keys('id', 'username', 'registrationDate');

        expect(res.body[2]).to.be.an('object')
        expect(res.body[2].id).to.be.a('string')
        expect(res.body[2].username).to.equal('Prisca')
        expect(res.body[2].username).to.be.a('string')
        expect(res.body[2].registrationDate).to.be.a('string')
        expect(res.body[2]).to.have.all.keys('id', 'username', 'registrationDate')
    });
});


//TEST POUR POST UN USER SUR LA ROUTE /USERS
describe('POST /users', function() {

    it('should create a user', async function() {
        const req = await supertest(app)
        .post('/users')
        .send({
            username: 'user de test',
            password: '123456789'
        })
        .expect(200)
        .expect('Content-Type', /json/);

        expect(req.body).to.be.an('object')
        expect(req.body.id).to.be.a('string')
        expect(req.body.username).to.equal('user de test')
        expect(req.body.username).to.be.a('string')
        expect(req.body.registrationDate).to.be.a('string')
        expect(req.body).to.have.all.keys('id', 'username', 'registrationDate');
    });
});


//TEST POUR DELETE UN USER SUR LA ROUTE USERS/:ID
describe('DELETE /users', function() {

    let user;
    let comment;
    beforeEach(async function() {
        user = await User.create({ username: 'Karim Rochat', password: '123456' });
        comment = await Comment.create({rating: 5, description: 'Un commentaire de test'})
    });

    it('should not delete a user if not authenticated', async function() {
        const res = await supertest(app)
        .delete('/users/'+ user._id)
        .expect(401);
    });

    it('should delete a user', async function() {
        const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;
        const claims = {sub: user._id.toString(), exp: exp};
        const token = jwt.sign(claims, config.secretKey);

        const res = await supertest(app)
        .delete('/users/'+ user._id)
        .set('Authorization', 'Bearer ' + token)
        .expect(204)
        });
});

after(mongoose.disconnect);