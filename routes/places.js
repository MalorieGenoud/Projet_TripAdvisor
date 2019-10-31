var express = require('express');
var router = express.Router();

// ------ Ressources TripAdvisor ------

// GET
router.get('/places/', function(req, res, next) {
    res.send('all places');
});

router.get('/places/:id', function(req, res, next) {
    res.send('place\'s profile');
});

router.get('/places/:id/comments', function(req, res, next) {
    res.send('place\'s comments');
});

// POST
router.post('/places/', function(req, res, next) {
    res.send('create places');
});

router.post('/places/:id/comments', function(req, res, next) {
    res.send('create place\'s comments');
});

// PUT
router.put('/places/:id', function(req, res, next) {
    res.send('update place');
});

router.put('/places/:id/comments/:id', function(req, res, next) {
    res.send('update place\'s comment');
});

// DELETE
router.delete('/places/:id', function(req, res, next) {
    res.send('delete place');
});

router.delete('/places/:id/comments/:id', function(req, res, next) {
    res.send('delete place\'s comment');
});

module.exports = router;
