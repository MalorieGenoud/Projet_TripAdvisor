const WebSocket = require('ws');
const { createLogger } = require('./config');

let tabCreateUsers = [];

exports.createBackendDispatcher = function(server) {
    // SETUP
    // =====
    const logger = createLogger('dispatcher');


    // COMMUNICATIONS
    // ==============

    const wss = new WebSocket.Server({
        server
    });

    // Handle new client connections.
    wss.on('connection', function(ws) {
        logger.info('New WebSocket client connected');
        tabCreateUsers.push(ws)
    });
}

// Counting the number of users
exports.nbUsers = function(users){
    tabCreateUsers.forEach(ws => {
        ws.send('There are ' + users + ' users');
    })
}

// Counting the number of places
exports.nbPlaces = function(places){
    tabCreateUsers.forEach(ws => {
        ws.send('There are ' + places + ' places');
    })
}

// Counting the number of comments
exports.nbComments = function(comments){
    tabCreateUsers.forEach(ws => {
        ws.send('There are ' + comments + ' comments');
    })
}