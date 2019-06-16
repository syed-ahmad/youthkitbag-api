const User = require('../models/user');

const UNAUTHORIZED = 'You are not authorized for this request';
const INVALID_CREDENTIALS = 'You have entered an invalid request';
const ACCOUNT_LOCKED = 'Your account has been locked out. Please reset your password.';

exports.getUser = (req, res, next) => {
  const userId = req.params.userId;

  User
    .findById(userId)
    .then(user => {
      if (userId.toString() !== req.userId.toString()) {
        const error = new Error(UNAUTHORIZED);
        error.statusCode = 403;
        throw error;
      }
      if (!user) {
        const error = new Error(INVALID_CREDENTIALS);
        error.statusCode = 401; 
        throw error;
      }
      if (user.locked) {
        const error = new Error(ACCOUNT_LOCKED);
        error.statusCode = 401; 
        throw error;
      }
      res.status(200).json({ profile: user.profile, package: user.package, email: user.email } );
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

