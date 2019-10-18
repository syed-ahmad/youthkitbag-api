const express = require('express');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const { authenticateThirdParty } = require('../controllers/auth');

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
      const { id, name, first_name, last_name, email } = profile._json;
      const picture = profile.photos ? profile.photos[0].value : undefined;

      const thirdparty = {
        appname: 'facebook',
        id: id,
        name: name,
        firstname: first_name,
        lastname: last_name,
        email: email,
        picture: picture,
        accessToken: accessToken
      };

      authenticateThirdParty(thirdparty, done);
    }
  )
);

router.get(
  '',
  passport.authenticate('facebook', { session: false, scope: ['email'] })
);

router.get(
  '/callback',
  passport.authenticate('facebook', {
    failureRedirect: `${clientUrl}/auth/login`,
    session: false
  }),
  (req, res) => {
    var token = req.user.token;
    res.redirect(`${clientUrl}/auth/token/${token}`);
  }
);

module.exports = router;
