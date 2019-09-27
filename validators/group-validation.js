const { body } = require('express-validator');
const { commaToArray, lowTagFormat } = require('../util/sanitizer');

exports.groupValidation = [
  body('name', 'Please enter a name of at least 5 characters')
    .trim()
    .isLength({ min: 5 }),
  body('tagline', 'Please enter a tagline of at least 5 characters')
    .trim()
    .customSanitizer(lowTagFormat)
    .isLength({ min: 5 }),
  body('description', 'Please enter a description of at least 10 characters')
    .trim()
    .isLength({ min: 10 }),
  body('email', 'Please enter a valid email')
    .normalizeEmail()
    .isEmail(),
  body('website', 'Please enter a valid website')
    .isURL()
    .customSanitizer(value =>
      value.startsWith('http') ? value : `http://${value}`
    ),
  body('activitys', 'Please specify at least one activity')
    .customSanitizer(commaToArray)
    .isArray({ min: 1 }),
  body('activitys.*').customSanitizer(lowTagFormat)
];
