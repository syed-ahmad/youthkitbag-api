const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');

// all routes in this module require authentication
router.get('/:userId', userController.getUser);

module.exports = router;
