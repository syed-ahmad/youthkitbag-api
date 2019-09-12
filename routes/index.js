const express = require('express');

const isAuth = require('../middleware/is-auth');

const accountRoutes = require('./account');
const subscriptionRoutes = require('./subscription');
const userRoutes = require('./user');
const kitbagRoutes = require('./kitbag');
const marketRoutes = require('./market');
const imageRoutes = require('./image');
const groupRoutes = require('./group');
const authRoutes = require('./auth');

const router = express.Router();

router.use('/account', isAuth, accountRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/user', isAuth, userRoutes);
router.use('/kitbag', isAuth, kitbagRoutes);
router.use('/market', marketRoutes);
router.use('/image', isAuth, imageRoutes);
router.use('/group', isAuth, groupRoutes);

router.use('/auth', authRoutes);

module.exports = router;
