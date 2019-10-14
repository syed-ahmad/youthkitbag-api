// const { body } = require('express-validator');
// const { dateFormat } = require('../util/sanitizer');

// exports.tradeValidation = [
//   body('offeredOn').customSanitizer(dateFormat),
//   body('details', 'Please enter at least 10 characters to describe your offer')
//     .trim()
//     .isLength({ min: 10 }),
//   body(
//     'offerPrice',
//     'Please enter a valid amount. It can be zero, if you want to give this item away for free'
//   )
//     .toFloat()
//     .isFloat({ min: 0, max: 99999.99 })
// ];

// exports.tradeValidation = [
//   body(
//     'askingPrice',
//     'Please enter a valid amount. It can be zero, if you want to give this item away for free'
//   )
//     .toFloat()
//     .isFloat({ min: 0, max: 99999.99 })
// ];

// exports.wantedValidation = [
//   body(
//     'offerPrice',
//     'Please enter a valid amount. It can be zero, if you only want to receive free offers'
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
