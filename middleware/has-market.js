const User = require('../models/user');

// make sure that the user has not reached the limit of kit that they can add
// we limit this to prevent bots creating excessive kit and overpopulating the system
// purchasing package options (or app admin users) can increase the number of kit items that a user can add

module.exports = (req, res, next) => {
  User.findById(req.userId)
    .then(user => {
      if (user.package.size.market >= user.package.max.market) {
        const error = new Error(
          'You have reached the limit of market place items that you can create on your account. Please upgrade your account.'
        );
        error.statusCode = 404;
        throw error;
      }
      next();
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
