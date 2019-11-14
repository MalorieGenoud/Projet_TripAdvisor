exports.port = process.env.PORT || '3000';
exports.databaseUrl = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost/tripadvisor';
exports.baseUrl = process.env.BASE_URL || `http://localhost:${exports.port}`;
exports.secretKey = process.env.SECRET_KEY || 'tripadvisor';

const { getLogger } = require('log4js');

/**
 * Creates a named logger for the application.
 * @param {string} name - The logger's name (will be part of each log line).
 * @returns {Logger} A configured logger.
 */
exports.createLogger = function(name) {

    const logger = getLogger(name);
    logger.level = exports.logLevel;

    return logger;
};