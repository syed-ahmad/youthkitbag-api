const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { authenticateThirdParty } = require('../controllers/auth');

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

      const thirdparty = {
        appname: 'google',
        id: sub,
        name: name,
        firstname: given_name,
        lastname: family_name,
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
