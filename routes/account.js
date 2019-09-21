const express = require('express');
const accountController = require('../controllers/account');
const dbController = require('../controllers/db');

const router = express.Router();
const DB_KEY = process.env.DB_KEY;

// all routes in this module require authentication

router.get('/profile', accountController.getProfile);
router.post('/profile', accountController.postProfile);
router.get(`/${DB_KEY}/:collection`, dbController.getCollection);

module.exports = router;
