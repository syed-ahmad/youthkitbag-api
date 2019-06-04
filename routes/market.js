const express = require('express');

const forsaleController = require('../controllers/forsale');
const wantedController = require('../controllers/wanted');
const stolenController = require('../controllers/stolen');
const marketController = require('../controllers/market');

const isAuth = require('../middleware/is-auth');;

const router = express.Router();

router.post('/create-message', isAuth, marketController.createMessage);

router.get('/forsale', forsaleController.getItems);
router.get('/forsale/:forsaleId', isAuth, forsaleController.getItem);

router.get('/wanted', wantedController.getItems);
router.get('/wanted/:wantedId', isAuth, wantedController.getItem);

router.get('/stolen', stolenController.getItems);
router.get('/stolen/:stolenId', isAuth, stolenController.getItem);

module.exports = router;
