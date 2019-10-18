const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { authenticateThirdParty } = require('../controllers/auth');

const router = express.Router();
const clientUrl = process.env.CLIENT_URL;

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/auth/github/callback',
      scope: 'user:email'
    },
    (accessToken, refreshToken, profile, done) => {
      // console.log('ACCESS', accessToken);
      // console.log('REFRESH', refreshToken);
      // console.log('PROFILE', profile);
      const { id, name, avatar_url } = profile._json;
      const email = profile.emails ? profile.emails[0].value : undefined;

      const thirdparty = {
        appname: 'github',
        id: id,
        name: profile.username,
        firstname: undefined,
        lastname: name,
        email: email,
        picture: avatar_url,
        accessToken: accessToken
      };

      // console.log('3RDPARTY', thirdparty);
      authenticateThirdParty(thirdparty, done);
    }
  )
);

router.get(
  '',
  passport.authenticate('github', {
    session: false,
    scope: ['user:email']
  })
);

router.get(
  '/callback',
  passport.authenticate('github', {
    failureRedirect: `${clientUrl}/auth/login`,
    session: false
  }),
  (req, res) => {
    var token = req.user.token;
    res.redirect(`${clientUrl}/auth/token/${token}`);
  }
);

module.exports = router;
