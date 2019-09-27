const User = require("../models/user");
const { validationResult } = require("express-validator");

exports.getProfile = (req, res, next) => {
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        user: user,
        errors: []
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postProfile = (req, res, next) => {
  const { username, activitys, groups } = req.body;

  User.findById(req.userIdÓ)
    .then(user => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }
      user.profile = {
        username: username,
        image: image.key,
        imageUrl: image.location,
        activitys: activitys,
        groups: groups
      };
      return user.save();
    })
    .then(result => {
      res.status(200).json({ user: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
