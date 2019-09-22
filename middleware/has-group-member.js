const User = require('../models/user');

// make sure that the user has not reached the limit of groups for which they can be member of
// we limit this to prevent bots creating random groups and overpopulating the system
// purchasing package options (or app admin users) can increase the number of groups that a user can be member of

module.exports = (req, res, next) => {
  User
    .findById(req.userId)
    .then (user => {
      if (user.package.size.groups >= user.package.max.groups) {
        const error = new Error('You have already reached the limit of groups that you can be a member of. Please upgrade your account.');
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
}