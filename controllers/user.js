const User = require("../models/user");

exports.getUser = (req, res, next) => {
  const userId = req.params.userId;

  User.findById(userId)
    .then(user => {
      res
        .status(200)
        .json({
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
  console.log("EDIT", req.params, req.body);
  const userId = req.params.userId;
  const { firstname, lastname, username, location, activitys } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== "D");
  const images = activeImages.map(i => {
    return { ...i, state: "A" };
  });

  const imagesToDelete = req.body.images.filter(i => i.state === "D");

  imagesToDelete.forEach(i => {
    awsHelper.deleteImage(i.image);
  });

  User.findById(userId)
    .then(user => {
      user.profile.firstname = firstname;
      user.profile.lastname = lastname;
      user.profile.username = username;
      user.profile.location = location;
      user.profile.activitys = activitys;
      console.log("USER B4", user);
      return user.save();
    })
    .then(result => {
      const profile = { ...result.profile, _id: result._id };
      console.log("PROF", profile);
      res
        .status(201)
        .json({
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
