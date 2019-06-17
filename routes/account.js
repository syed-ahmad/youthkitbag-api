const express = require('express');
const router = express.Router();

const accountController = require('../controllers/account');
const dbController = require('../controllers/db');

// all routes in this module require authentication
router.get('/profile', accountController.getProfile);
router.post('/profile', accountController.postProfile);

const DB_KEY = process.env.DB_KEY;
router.get(`/${DB_KEY}/:collection`, dbController.getCollection);

module.exports = router;
