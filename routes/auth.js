const express = require('express');
const { check, body } =require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.post(
  '/login', 
  [
    check('email', 'Please enter a valid email')
      .isEmail(),
    body('password', 'Please enter a valid password')
      .isLength({min: 5})
  ],
  authController.login);

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
    body('password')
      .isLength({min: 5})
      .withMessage('Password must be at least 5 characters')
      .trim(),
    body('confirmPassword')
      .custom((value, {req}) => {
        if (value !== req.body.password) {
          throw new Error('Passwords must match');
        }
        return true;
      })
      .trim()
  ],
  authController.signup);

router.post('/reset', authController.reset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;