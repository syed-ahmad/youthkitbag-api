const { check } = require('express-validator');
const User = require('../models/user');

exports.signupValidation = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then(userDoc => {
        if (userDoc) {
          return Promise.reject('Email already exists.');
        }
      });
    }),
  check('password')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 characters'),
  check('confirmPassword')
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords must match');
      }
      return true;
    })
];

exports.loginValidation = [
  check('email', 'Please enter a valid email').isEmail(),
  check('password', 'Please enter a valid password')
    .trim()
    .isLength({ min: 5 })
];

exports.resetValidation = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then(userDoc => {
        if (!userDoc) {
          return Promise.reject('Account does not exist');
        }
      });
    })
];

exports.newPasswordValidation = [
  check('userId')
    .not()
    .isEmpty()
    .withMessage('The user id is required'),
  check('passwordToken')
    .not()
    .isEmpty()
    .withMessage('The password token is required'),
  check('password')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 characters')
];
