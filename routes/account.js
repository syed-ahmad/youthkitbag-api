const express = require('express');
const router = express.Router();

const accountController = require('../controllers/account');
const userController = require('../controllers/user');
const dbController = require('../controllers/db');

// all routes in this module require authentication
router.get('/profile', accountController.getProfile);
router.post('/profile', accountController.postProfile);

router.get('/:userId', userController.getUser);

const DB_KEY = process.env.DB_KEY;
router.get(`/${DB_KEY}/:collection`, dbController.getCollection);

module.exports = router;
