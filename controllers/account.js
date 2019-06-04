const User = require('../models/user');
const { validationResult} = require('express-validator/check');

exports.getProfile = (req, res, next) => {
  User
    .findById(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('User not found');
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
  const username = req.body.username;
  const image = req.file;
  const imageUrl = req.body.imageUrl;
  const origImage = req.body.origImage;
  const origImageUrl = req.body.origImageUrl;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.split(',').map(s => s.trim().toLowerCase());
  }

  let groups = req.body.groups;
  if (groups) {
    groups = groups.split(',').map(s => s.trim().toLowerCase());
  }

  const validation = validationResult(req);
  let errors = [];
  if (!validation.isEmpty()) {
    errors = validation.array();
  }
  if (errors.length) {
    return res.status(422).json({
      user: {
        profile: {
          username: username
        },
        image: image || origImage,
        imageUrl: imageUrl || origImageUrl,
        activitys: activitys,
        groups: groups
      },
      errors: errors
    });
  }

  User
    .findById(req.userIdÓ)
    .then(user => {
      if (!user) {
        const error = new Error('User not found');
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
      return user.save()
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
