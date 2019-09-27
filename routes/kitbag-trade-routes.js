const express = require('express');
const tradeController = require('../controllers/kitbag-trade');
const checkValidationResult = require('../middleware/check-validation-result');
const {
  kitbagValidation,
  tradeValidation
} = require('../validators/kitbag-validation');
const hasTrade = require('../middleware/has-trade');
const isTradeOwner = require('../middleware/is-trade-owner');
const isKitOwner = require('../middleware/is-kit-owner');

const router = express.Router();

// all routes in this module require authentication, route is /kitbag/trade

router.post(
  '',
  hasTrade,
  kitbagValidation,
  tradeValidation,
  checkValidationResult,
  tradeController.add
);
router.put(
  '/:tradeId',
  isTradeOwner,
  kitbagValidation,
  tradeValidation,
  checkValidationResult,
  tradeController.edit
);
router.delete('/:tradeId', isTradeOwner, tradeController.delete);
router.get('/add/:kitId', hasTrade, isKitOwner, tradeController.getAdd);
router.get('/:tradeId', isTradeOwner, tradeController.getItem);
router.get('', tradeController.getItems);

module.exports = router;
