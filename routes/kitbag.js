const express = require('express');
const { body } = require('express-validator/check');

const kitController = require('../controllers/kitbag-kit');
const forsaleController = require('../controllers/kitbag-forsale');
const wantedController = require('../controllers/kitbag-wanted');

const router = express.Router();

const kitValidation = [
  body('title', 'Please enter a title of at least 5 characters').isLength({min: 5})
];

// all routes in this module require authentication
router.post('/kits', kitValidation, kitController.add);
router.get('/kits/containers', kitValidation, kitController.getContainers);
router.put('/kits/:kitId', kitValidation, kitController.edit);
router.delete('/kits/:kitId', kitController.delete);
router.get('/kits/:kitId', kitController.getItem);
router.get('/kits', kitController.getItems);


//router.get('/forsales/add/:kitId', forsaleController.getAdd);
router.post('/forsales', kitValidation, forsaleController.add);
router.put('/forsales/:forsaleId', kitValidation, forsaleController.edit);
router.delete('/forsales/:forsaleId', forsaleController.delete);
router.get('/forsales/:forsaleId', forsaleController.getItem);
router.get('/forsales', forsaleController.getItems);

//router.get('/wanted/add/:kitId', wantedController.getAdd);
router.post('/wanteds', kitValidation, wantedController.add);
router.put('/wanteds/:wantedId', kitValidation, wantedController.edit);
router.delete('/wanteds/:wantedId', wantedController.delete);
router.get('/wanteds/:wantedId', wantedController.getItem);
router.get('/wanteds', wantedController.getItems);

module.exports = router;
