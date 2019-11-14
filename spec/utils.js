const User = require('../models/users');

exports.cleanUpDatabase = async function() {
    await Promise.all([
        User.deleteMany()
    ]);
};

