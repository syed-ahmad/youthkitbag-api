const express = require('express');
const tradeController = require('../controllers/kitbag-trade');
const checkValidationResult = require('../middleware/checkValidationResult');
const { kitbagValidation, tradeValidation } = require('../validators/kitbag-validation');

const router = express.Router();

// all routes in this module require authentication, route is /kitbag/trade

router.post('', kitbagValidation, tradeValidation, checkValidationResult, tradeController.add);
router.put('/:tradeId', kitbagValidation, tradeValidation, checkValidationResult, tradeController.edit);
router.delete('/:tradeId', tradeController.delete);
router.get('/add/:kitId', tradeController.getAdd);
router.get('/:tradeId', tradeController.getItem);
router.get('', tradeController.getItems);

module.exports = router;
