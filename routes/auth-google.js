const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

const router = express.Router();
const clientUrl = process.env.CLIENT_URL;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    },
    (accessToken, refreshToken, profile, done) => {
      const {
        sub,
        name,
        given_name,
        family_name,
        email,
        picture
      } = profile._json;

      User.find({ $or: [{ googleId: sub }, { email: email }] })
        .countDocuments()
        .then(numberOfItems => {
          if (numberOfItems > 1) {
            // Woah!!! Two accounts exist. How is this possible? If it is throw exception to user and ask to contact admin
            console.log(
              'Woah!!! Two accounts exist. How is this possible? If it is throw exception to user and ask to contact admin'
            );
            done(null, false, {
              message: `More than one account is associated with this Google account [id=${sub}/email=${email}]. Please contact the YouthKitbag administrator.`
            });
          }
          if (numberOfItems === 1) {
            // Account exists, check if email and google account are linked - if not, then update
            User.findOne({ $or: [{ googleId: sub }, { email: email }] })
              .then(existingUser => {
                if (existingUser) {
                  if (!existingUser.googleId) {
                    existingUser.googleId = sub;
                  }
                  if (!existingUser.profile.firstname) {
                    existingUser.profile.firstname = given_name;
                  }
                  if (!existingUser.profile.lastname) {
                    existingUser.profile.lastname = family_name;
                  }
                  if (!existingUser.profile.username) {
                    existingUser.profile.username = name;
                  }
                  if (!existingUser.profile.images) {
                    existingUser.profile.images = [];
                  }
                  if (
                    existingUser.profile.images.filter(
                      i => i.imageUrl === picture
                    ).length === 0
                  ) {
                    existingUser.profile.images.unshift({ imageUrl: picture });
                  }
                  existingUser.token = accessToken;
                  existingUser.tokenExpiration = Date.now() + 10000;
                  existingUser
                    .save()
                    .then(user =>
                      done(null, {
                        token: user.token
                      })
                    )
                    .catch(err => {
                      done(err);
                    });
                }
              })
              .catch(err => done(err));
          }
          if (numberOfItems === 0) {
            // Account does not exist, so create a new account
            const newUser = {
              email: email,
              googleId: sub,
              profile: {
                firstname: given_name,
                lastname: family_name,
                username: name,
                groups: [],
                images: [
                  {
                    imageUrl: picture
                  }
                ]
              },
              token: accessToken,
              tokenExpiration: Date.now() + 10000
            };
            new User(newUser)
              .save()
              .then(user =>
                done(null, {
                  token: user.token
                })
              )
              .catch(err => {
                done(err);
              });
          }
        })
        .catch(err => done(err));
    }
  )
);

router.get(
  '',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email']
  })
);

router.get(
  '/callback',
  passport.authenticate('google', {
    failureRedirect: `${clientUrl}/auth/login`,
    session: false
  }),
  (req, res) => {
    var token = req.user.token;
    res.redirect(`${clientUrl}/auth/token/${token}`);
  }
);

module.exports = router;
