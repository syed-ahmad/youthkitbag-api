const express = require('express');

const isAuth = require('../middleware/is-auth');

const accountRoutes = require('./account');
const subscriptionRoutes = require('./subscription');
const userRoutes = require('./user');
const kitbagKitRoutes = require('./kitbag-kit');
const kitbagMarketRoutes = require('./kitbag-market');
const marketRoutes = require('./market');
const imageRoutes = require('./image');
const groupRoutes = require('./group');
const authRoutes = require('./auth');
const authGoogleRoutes = require('./auth-google');
const authFacebookRoutes = require('./auth-facebook');
const authGitHubRoutes = require('./auth-github');

const router = express.Router();

router.use('/account', isAuth, accountRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/user', isAuth, userRoutes);
router.use('/kitbag/kit', isAuth, kitbagKitRoutes);
router.use('/kitbag/market', isAuth, kitbagMarketRoutes);
router.use('/market', marketRoutes);
router.use('/image', isAuth, imageRoutes);
router.use('/group', isAuth, groupRoutes);

router.use('/auth/google', authGoogleRoutes);
router.use('/auth/facebook', authFacebookRoutes);
router.use('/auth/github', authGitHubRoutes);
router.use('/auth', authRoutes);

module.exports = router;
