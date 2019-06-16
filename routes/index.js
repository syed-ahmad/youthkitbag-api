const express = require('express');

const isAuth = require('../middleware/is-auth');

const accountRoutes = require('./account');
const kitbagRoutes = require('./kitbag');
const marketRoutes = require('./market');
const authRoutes = require('./auth');

const router = express.Router();

router.use('/account', isAuth, accountRoutes);
router.use('/kitbag', isAuth, kitbagRoutes);
router.use('/market', marketRoutes);

router.use('/auth', authRoutes);

//router.get('/purchase/:package', isAuth, rootController.getPurchase);

module.exports = router;
