const { body } = require('express-validator');
const { commaToArray, lowTagFormat } = require('../util/sanitizer');

exports.userValidation = [
  body('lastname', 'Please enter a last name of at least 2 characters')
    .trim()
    .isLength({ min: 2 }),
  body('firstname', 'Please enter a first name of')
    .trim()
    .isLength({ min: 1 }),
  body('username').trim(),
  body('activitys', 'Please specify at least one activity')
    .customSanitizer(commaToArray)
    .isArray({ min: 1 }),
  body('activitys.*').customSanitizer(lowTagFormat)
];
