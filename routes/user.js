const express = require('express');
const userController = require('../controllers/user');
const isUser = require('../middleware/is-user');
const { userValidation } = require('../validators/user-validation');
const checkValidationResult = require('../middleware/check-validation-result');

const router = express.Router();

// all routes in this module require authentication

router.get('/:userId', isUser, userController.getUser);
router.put('/:userId/profile', isUser, userValidation, checkValidationResult, userController.editProfile);

module.exports = router;
