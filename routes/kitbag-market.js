const express = require('express');
const kitbagMarketController = require('../controllers/kitbag-market');
const checkValidationResult = require('../middleware/check-validation-result');
const {
  kitbagValidation,
  marketValidation
} = require('../validators/kitbag-validation');
const hasMarket = require('../middleware/has-market');
const isMarketOwner = require('../middleware/is-market-owner');
const isKitOwner = require('../middleware/is-kit-owner');

const router = express.Router();

// all routes in this module require authentication, route is /kitbag/market

router.post(
  '',
  hasMarket,
  kitbagValidation,
  marketValidation,
  checkValidationResult,
  kitbagMarketController.add
);
router.put(
  '/:marketId',
  isMarketOwner,
  kitbagValidation,
  marketValidation,
  checkValidationResult,
  kitbagMarketController.edit
);
router.delete('/:marketId', isMarketOwner, kitbagMarketController.delete);
router.get(
  '/add/:kitId/:marketType',
  hasMarket,
  isKitOwner,
  kitbagMarketController.getAdd
);
router.get('/:marketId', isMarketOwner, kitbagMarketController.getItem);
router.get('', kitbagMarketController.getItems);

module.exports = router;
