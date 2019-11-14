const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { cleanUpDatabase } = require('./utils');
const User = require('../models/users');


beforeEach(cleanUpDatabase);



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
        expect(res.body).to.have.lengthOf(2)

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
        const res = await supertest(app)
        .post('/users')
        .send({
            username: 'testestest',
            password: '1234'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        });
});


/*
Pour récupérer son Token :
1. Il faut d'abord créer un utilisateur à la route POST/users à l'aide d'un username et d'un password. 
2. Toujours en conservant le username et le password dans le body, simplement se connecter à la route POST/login. Le serveur renverra en réponse dans son body le token pour cet utilisateur et cet utilisateur seulement (chaque utilisateur a un token qui lui est propre)
3. Copier le token, guillements non compris.
4. Se rendre dans l'onglet "Authorization", faire dérouler la liste TYPE et choisir "Bearer Token". Copier votre token dans la zone à droite et surtout supprimer les informations username et password dans le body (on n'en a plus besoin, le principe du token est de justement remplacer ces éléments d'authentification, parce que le token lui-même contient ces informations en lui)
5. Maintenant, essayer d'accéder à une route protégée par une authentification, telle que POST/places et créez une place, tout en suivant biensûr le modèle.
6. La place a été crée. Vous voyez que vous avez créé une place avec la simple utilisation de votre token, vous n'avez pas eu besoin d'entrer votre identifications ou que ce soit, parce que le token contient en lui ces informations. 
*/

after(mongoose.disconnect);


