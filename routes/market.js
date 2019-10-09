const express = require('express');
const tradeController = require('../controllers/market-trade');
const wantedController = require('../controllers/market-wanted');
const stolenController = require('../controllers/market-stolen');
const marketController = require('../controllers/market');
const isAuth = require('../middleware/is-auth');
const inGroups = require('../middleware/in-groups');

const router = express.Router();

router.post('/create-message', isAuth, marketController.createMessage);

router.get('/trade', isAuth, inGroups, tradeController.getItems);
router.get('/trade/:tradeId', isAuth, inGroups, tradeController.getItem);

router.get('/wanted', isAuth, inGroups, wantedController.getItems);
router.get('/wanted/:wantedId', isAuth, inGroups, wantedController.getItem);

router.get('/stolen', isAuth, inGroups, stolenController.getItems);
router.get('/stolen/:stolenId', isAuth, inGroups, stolenController.getItem);

module.exports = router;
