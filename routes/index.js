const express = require('express');

const isAuth = require('../middleware/is-auth');

const accountRoutes = require('./account');
const subscriptionRoutes = require('./subscription');
const userRoutes = require('./user');
const kitbagKitRoutes = require('./kitbag-kit-routes');
const kitbagTradeRoutes = require('./kitbag-trade-routes');
const kitbagWantedRoutes = require('./kitbag-wanted-routes');
const kitbagStolenRoutes = require('./kitbag-stolen-routes');
const marketRoutes = require('./market');
const imageRoutes = require('./image');
const groupRoutes = require('./group');
const authRoutes = require('./auth');

const router = express.Router();

router.use('/account', isAuth, accountRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/user', isAuth, userRoutes);
router.use('/kitbag/kit', isAuth, kitbagKitRoutes);
router.use('/kitbag/trade', isAuth, kitbagTradeRoutes);
router.use('/kitbag/wanted', isAuth, kitbagWantedRoutes);
router.use('/kitbag/stolen', isAuth, kitbagStolenRoutes);
router.use('/market', marketRoutes);
router.use('/image', isAuth, imageRoutes);
router.use('/group', isAuth, groupRoutes);

router.use('/auth', authRoutes);

module.exports = router;
