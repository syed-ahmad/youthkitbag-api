const { body } = require('express-validator');
const { commaToArray, caseTagFormat, lowTagFormat } = require('../util/sanitizer');

exports.kitbagValidation = [
  body('title', 'Please enter a title of at least 5 characters').trim().isLength({min: 5}),
  body('subtitle').trim(),
  body('description').trim(),
  body('activitys', 'Please specify at least one activity').customSanitizer(commaToArray).isArray({min: 1}),
  body('activitys.*').customSanitizer(lowTagFormat),
];

exports.kitValidation = [
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

exports.tradeValidation = [
  body('askingPrice').toFloat()
];

exports.wantedValidation = [
  body('offerPrice').toFloat()
];

exports.stolenValidation = [
  body('security').customSanitizer(commaToArray),
  body('security.*').customSanitizer(caseTagFormat),
  body('stolenOn', 'Please specify the date the item was stolen').isISO8601().toDate(),
  body('tracking').trim()
];
