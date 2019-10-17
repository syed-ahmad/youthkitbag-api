const express = require('express');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user');

const router = express.Router();
const clientUrl = process.env.CLIENT_URL;

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: '/auth/facebook/callback',
      profileFields: [
        'id',
        'emails',
        'name',
        'displayName',
        'profileUrl',
        'picture.type(large)'
      ]
    },
    (accessToken, refreshToken, profile, done) => {
      // console.log('ACCESS', accessToken);
      // console.log('REFRESH', refreshToken);
      // console.log('PROFILE', profile);
      // console.log('DONE', done);

      const { id, name, first_name, last_name, email } = profile._json;
      const picture = profile.photos ? profile.photos[0].value : undefined;

      User.find({ $or: [{ facebookId: id }, { email: email }] })
        .countDocuments()
        .then(numberOfItems => {
          if (numberOfItems > 1) {
            // Woah!!! Two accounts exist. How is this possible? If it is throw exception to user and ask to contact admin
            console.log(
              'Woah!!! Two accounts exist. How is this possible? If it is throw exception to user and ask to contact admin'
            );
            done(null, false, {
              message: `More than one account is associated with this Facebook account [id=${id}/email=${email}]. Please contact the YouthKitbag administrator.`
            });
          }
          if (numberOfItems === 1) {
            // Account exists, check if email and facebook account are linked - if not, then update
            User.findOne({ $or: [{ facebookId: id }, { email: email }] })
              .then(existingUser => {
                if (existingUser) {
                  if (!existingUser.facebookId) {
                    existingUser.facebookId = id;
                  }
                  if (!existingUser.profile.firstname) {
                    existingUser.profile.firstname = first_name;
                  }
                  if (!existingUser.profile.lastname) {
                    existingUser.profile.lastname = last_name;
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
              facebookId: id,
              profile: {
                firstname: first_name,
                lastname: last_name,
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

router.get('', passport.authenticate('facebook', { scope: ['email'] }));

router.get(
  '/callback',
  passport.authenticate('facebook', {
    failureRedirect: `${clientUrl}/auth/login`,
    session: false
  }),
  (req, res) => {
    console.log('USER', req.user);
    var token = req.user.token;
    res.redirect(`${clientUrl}/auth/token/${token}`);
  }
);

module.exports = router;
