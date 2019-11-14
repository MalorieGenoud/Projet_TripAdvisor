const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { cleanUpDatabase } = require('./utils');
const User = require('../models/places');


//TEST POUR UPDATE UNE PLACE
describe('PUT /places/:id', function() {
  it('should update the place');
});


//TEST POUR DELETE UN COMMENTAIRE
describe('DELETE /places/:idPlace/comments/:id', function() {
  it('should delete the place');
});