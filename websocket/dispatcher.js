// ------ REQUIRE ------
const WebSocket = require('ws');

// ------ LOGGER ------
const { createLogger } = require('../config');

// ------ VARIABLES ------
let tabCreateUsers = [];

// ------ FUNCTIONS ------
exports.createBackendDispatcher = function(server) {
    // SETUP
    const logger = createLogger('Websocket TripAdvisor');

    // COMMUNICATIONS
    const wss = new WebSocket.Server({
        server
    });

    // Handle new client connections.
    wss.on('connection', function(ws) {
        logger.info('New WebSocket client connected');
        tabCreateUsers.push(ws);

        // Forget the mapping when the client disconnects.
        ws.on('close', () => {
            logger.info(`You are disconnected`);
            delete tabCreateUsers[0];
        });
    });
};

// Counting the number of users
exports.nbUsers = function(users){
    tabCreateUsers.forEach(ws => {
        ws.send('There are ' + users + ' users');
    })
};

// Counting the number of places
exports.nbPlaces = function(places){
    tabCreateUsers.forEach(ws => {
        ws.send('There are ' + places + ' places');
    })
};

// Counting the number of comments
exports.nbComments = function(comments){
    tabCreateUsers.forEach(ws => {
        ws.send('There are ' + comments + ' comments');
    })
};