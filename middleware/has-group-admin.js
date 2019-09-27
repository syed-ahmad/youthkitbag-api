const User = require('../models/user');

// make sure that the user has not reached the limit of groups for which they can be admin for
// we limit this to prevent bots creating random groups and overpopulating the system
// purchasing package options (or app admin users) can increase the number of groups that a user can be admin for

module.exports = (req, res, next) => {
  User.findById(req.userId)
    .then(user => {
      if (user.package.size.groupadmins >= user.package.max.groupadmins) {
        const error = new Error(
          'You have already reached the limit of groups that you can be administrator for. Please upgrade your account.'
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
