const { query } = require('express-validator');
const { lower } = require('../util/sanitizer');

exports.searchValidation = [
  query('search')
    .trim('')
    .customSanitizer(lower),
  query('page').toInt(),
  query('pagesize').toInt()
];
