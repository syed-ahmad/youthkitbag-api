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
router.put('/kits/:kitId', kitValidation, kitController.edit);
router.delete('/kits/:kitId', kitController.delete);
router.get('/kits/:kitId', kitController.getItem);
router.get('/kits', kitController.getItems);

router.get('/forsale/add/:kitId', forsaleController.getAdd);
router.post('/forsale/add', kitValidation, forsaleController.add);
router.post('/forsale/edit', kitValidation, forsaleController.edit);
router.post('/forsale/delete', forsaleController.delete);
router.get('/forsale/:forsaleId', forsaleController.getItem);
router.get('/forsale', forsaleController.getItems);

router.get('/wanted/add/:kitId', wantedController.getAdd);
router.post('/wanted/add', kitValidation, wantedController.add);
router.post('/wanted/edit', kitValidation, wantedController.edit);
router.post('/wanted/delete', wantedController.delete);
router.get('/wanted/:wantedId', wantedController.getItem);
router.get('/wanted', wantedController.getItems);

module.exports = router;
