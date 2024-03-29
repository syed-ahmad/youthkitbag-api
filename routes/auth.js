const express = require('express');
const authController = require('../controllers/auth');
const {
  signupValidation,
  loginValidation,
  resetValidation,
  newPasswordValidation,
  tokenValidation
} = require('../validators/auth-validation');

const router = express.Router();

router.post('/signup', signupValidation, authController.signup);
router.post('/login', loginValidation, authController.login);
router.post('/reset', resetValidation, authController.reset);
router.get('/reset/:token', authController.getNewPassword);
router.post(
  '/new-password',
  newPasswordValidation,
  authController.postNewPassword
);
router.post('/authenticate', tokenValidation, authController.authenticate);

module.exports = router;
