const express = require('express');
const { check } =require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.post(
  '/signup', 
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, {req}) => {
        return User.findOne({email: value}).then(userDoc => { 
          if (userDoc) {
            return Promise.reject('Email already exists.');
          }
        });
      })
      .normalizeEmail(),
    check('password')
      .isLength({min: 5})
      .withMessage('Password must be at least 5 characters')
      .trim(),
    check('confirmPassword')
      .custom((value, {req}) => {
        if (value !== req.body.password) {
          throw new Error('Passwords must match');
        }
        return true;
      })
      .trim()
  ],
  authController.signup);

router.post(
  '/login', 
  [
    check('email', 'Please enter a valid email')
      .isEmail(),
    check('password', 'Please enter a valid password')
      .isLength({min: 5})
  ],
  authController.login);

router.post(
  '/reset', 
  [
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value, {req}) => {
      return User.findOne({email: value}).then(userDoc => { 
        if (!userDoc) {
          return Promise.reject('Account does not exist');
        }
      });
    })
    .normalizeEmail()
  ],
  authController.reset);

router.get('/reset/:token', authController.getNewPassword);

router.post(
  '/new-password', 
  [
    check('userId')
      .not().isEmpty()
      .withMessage('The user id is required'),
    check('passwordToken')
      .not().isEmpty()
      .withMessage('The password token is required'),
    check('password')
      .isLength({min: 5})
      .withMessage('Password must be at least 5 characters')
      .trim()
  ],
  authController.postNewPassword);

module.exports = router;