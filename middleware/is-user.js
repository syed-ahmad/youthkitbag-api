const User = require('../models/user');

module.exports = (req, res, next) => {
  const userId = req.params.userId;

  User.findById(userId)
  .then(user => {
    if (userId.toString() !== req.userId.toString()) {
      const error = new Error('You are not authorized for this request');
      error.statusCode = 403;
      throw error;
    }
    if (!user) {
      const error = new Error('You have entered an invalid request');
      error.statusCode = 401; 
      throw error;
    }
    if (user.locked) {
      const error = new Error('Your account has been locked out. Please reset your password.');
      error.statusCode = 401; 
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