const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { cleanUpDatabaseUser } = require('./utils');
const User = require('../models/users');
const Place = require('../models/places');
const Comment = require('../models/comments');


beforeEach(cleanUpDatabaseUser);

//TEST POUR GET UN USER
describe('GET /users', function() {
    beforeEach(async function() {
        await Promise.all([
            User.create({ username: 'John Doe', password: '123456789' }),
            User.create({ username: 'Jane Doe', password: '987654321' })
        ]);
    }); 
    it('should retrieve the list of users', async function() {
        const res = await supertest(app)
        .get('/users')
        .expect(200)
        .expect('Content-Type', /json/);

        expect(res.body).to.be.an('array')

        expect(res.body[0]).to.be.an('object')
        expect(res.body[0].id).to.be.a('string')
        expect(res.body[0].username).to.equal('Jane Doe')
        expect(res.body[0].registrationDate).to.be.a('string')
        expect(res.body[0]).to.have.all.keys('id', 'username', 'registrationDate')

        expect(res.body[1]).to.be.an('object')
        expect(res.body[1].id).to.be.a('string')
        expect(res.body[1].username).to.equal('John Doe')
        expect(res.body[1].registrationDate).to.be.a('string')
        expect(res.body[1]).to.have.all.keys('id', 'username', 'registrationDate');
    });
});


//TEST POUR POST UN USER
describe('POST /users', function() {
    it('should create a user', async function() {
        const req = await supertest(app)
        .post('/users')
        .send({
            username: 'user',
            password: '1234'
        })
        .expect(200)
        .expect('Content-Type', /json/);

        expect(req.body).to.be.an('object')
        expect(req.body.id).to.be.a('string')
        expect(req.body.username).to.equal('user')
        expect(req.body.registrationDate).to.be.a('string')
        expect(req.body).to.have.all.keys('id', 'username', 'registrationDate');
    });
});

after(mongoose.disconnect);