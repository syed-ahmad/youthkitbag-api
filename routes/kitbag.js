const express = require('express');
const { body } = require('express-validator');
const kitController = require('../controllers/kitbag-kit');
const tradeController = require('../controllers/kitbag-trade');
const wantedController = require('../controllers/kitbag-wanted');
const stolenController = require('../controllers/kitbag-stolen');
const { commaToArray, caseTagFormat, lowTagFormat } = require('../util/sanitizer');
const checkValidationResult = require('../middleware/checkValidationResult');

const router = express.Router();

const kitbagValidation = [
  body('title', 'Please enter a title of at least 5 characters').trim().isLength({min: 5}),
  body('subtitle').trim(),
  body('description').trim(),
  body('activitys', 'Please specify at least one activity').customSanitizer(commaToArray).isArray({min: 1}),
  body('activitys.*').customSanitizer(lowTagFormat),
];

const kitValidation = [
  body('security').customSanitizer(commaToArray),
  body('security.*').customSanitizer(caseTagFormat),
  body('purchases.*.from').trim(),
  body('purchases.*.quantity').toInt(),
  body('purchases.*.ondate').optional({checkFalsy: true}).isISO8601().toDate(),
  body('purchases.*.price').toFloat(),
  body('inbag.*.location').trim(),
  body('inbag.*.quantity').toInt(),
  body('warning').toInt(),
  body('tags', 'Please specify at least one tag').customSanitizer(commaToArray).isArray({min: 1}),
  body('tags.*').customSanitizer(lowTagFormat),
  body('tracking').trim()
];

const tradeValidation = [
  body('askingPrice').toFloat()
];

const wantedValidation = [
  body('offerPrice').toFloat()
];

const stolenValidation = [
  body('security').customSanitizer(commaToArray),
  body('security.*').customSanitizer(caseTagFormat),
  body('stolenOn', 'Please specify the date the item was stolen').isISO8601().toDate(),
  body('tracking').trim()
];

// all routes in this module require authentication
router.post('/kit', kitbagValidation, kitValidation, checkValidationResult, kitController.add);
router.get('/kit/containers', kitController.getContainers);
router.put('/kit/:kitId', kitbagValidation, kitValidation, checkValidationResult, kitController.edit);
router.delete('/kit/:kitId', kitController.delete);
router.get('/kit/:kitId', kitController.getItem);
router.get('/kit', kitController.getItems);

router.get('/trade/add/:kitId', tradeController.getAdd);
router.post('/trade', kitbagValidation, tradeValidation, tradeController.add);
router.put('/trade/:tradeId', kitbagValidation, tradeValidation, tradeController.edit);
router.delete('/trade/:tradeId', tradeController.delete);
router.get('/trade/:tradeId', tradeController.getItem);
router.get('/trade', tradeController.getItems);

router.get('/wanted/add/:kitId', wantedController.getAdd);
router.post('/wanted', kitbagValidation, wantedValidation, wantedController.add);
router.put('/wanted/:wantedId', kitbagValidation, wantedValidation, wantedController.edit);
router.delete('/wanted/:wantedId', wantedController.delete);
router.get('/wanted/:wantedId', wantedController.getItem);
router.get('/wanted', wantedController.getItems);

router.get('/stolen/add/:kitId', stolenController.getAdd);
router.post('/stolen', kitbagValidation, stolenValidation, stolenController.add);
router.put('/stolen/:stolenId', kitbagValidation, stolenValidation, stolenController.edit);
router.delete('/stolen/:stolenId', stolenController.delete);
router.get('/stolen/:stolenId', stolenController.getItem);
router.get('/stolen', stolenController.getItems);

module.exports = router;
