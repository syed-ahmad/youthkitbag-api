const express = require('express');
const userController = require('../controllers/user');

const router = express.Router();

// all routes in this module require authentication

router.get('/:userId', userController.getUser);

module.exports = router;
