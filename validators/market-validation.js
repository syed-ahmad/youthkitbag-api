// const { body } = require('express-validator');
// const { dateFormat } = require('../util/sanitizer');

// exports.tradeValidation = [
//   body('responseOn').customSanitizer(dateFormat),
//   body('details', 'Please enter at least 10 characters to describe your responseDetail')
//     .trim()
//     .isLength({ min: 10 }),
//   body(
//     'responsePrice',
//     'Please enter a valid amount. It can be zero, if you want to give this item away for free'
//   )
//     .toFloat()
//     .isFloat({ min: 0, max: 99999.99 })
// ];

// exports.tradeValidation = [
//   body(
//     'marketPrice',
//     'Please enter a valid amount. It can be zero, if you want to give this item away for free'
//   )
//     .toFloat()
//     .isFloat({ min: 0, max: 99999.99 })
// ];

// exports.wantedValidation = [
//   body(
//     'responsePrice',
//     'Please enter a valid amount. It can be zero, if you only want to receive free responseDetails'
//   )
//     .toFloat()
//     .isFloat({ min: 0, max: 99999.99 })
// ];

// exports.stolenValidation = [
//   body('security').customSanitizer(commaToArray),
//   body('security.*').customSanitizer(caseTagFormat),
//   body(
//     'stolenOn',
//     'Please specify the date the item was stolen'
//   ).customSanitizer(dateFormat),
//   body('tracking').trim()
// ];
