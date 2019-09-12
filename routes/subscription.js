const express = require('express');

const subscriptionController = require('../controllers/subscription');

const isAuth = require('../middleware/is-auth');;

const router = express.Router();

router.get('/:subscriptionId', isAuth, subscriptionController.getPackage);

module.exports = router;
