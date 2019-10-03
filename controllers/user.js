const User = require('../models/user');
const awsHelper = require('../util/aws-helper');

exports.getUser = (req, res, next) => {
  const userId = req.params.userId;

  User.findById(userId)
    .populate('profile.groups', 'name images')
    .then(user => {
      res.status(200).json({
        profile: { ...user.profile, _id: user._id },
        package: user.package,
        email: user.email
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// PUT request to save edited changes to existing item in kitbag
exports.editProfile = (req, res, next) => {
  const userId = req.params.userId;
  const { firstname, lastname, username, activitys } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return { ...i, state: 'A' };
  });

  const imagesToDelete = req.body.images.filter(i => i.state === 'D');

  imagesToDelete.forEach(i => {
    awsHelper.deleteImage(i.image);
  });

  User.findById(userId)
    .then(user => {
      user.profile.firstname = firstname;
      user.profile.lastname = lastname;
      user.profile.username = username;
      user.profile.activitys = activitys;
      user.profile.images = images;
      return user.save();
    })
    .then(result => {
      const profile = { ...result.profile, _id: result._id };
      res.status(201).json({
        message: `User profile successfully updated.`,
        profile: profile
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
