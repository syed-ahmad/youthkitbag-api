const express = require('express');
const { body } = require('express-validator/check');

const kitController = require('../controllers/kitbag-kit');
const tradeController = require('../controllers/kitbag-trade');
const wantedController = require('../controllers/kitbag-wanted');
const stolenController = require('../controllers/kitbag-stolen');

const router = express.Router();

const kitValidation = [
  body('title', 'Please enter a title of at least 5 characters').isLength({min: 5})
];

// all routes in this module require authentication
router.post('/kit', kitValidation, kitController.add);
router.get('/kit/containers', kitValidation, kitController.getContainers);
router.put('/kit/:kitId', kitValidation, kitController.edit);
router.delete('/kit/:kitId', kitController.delete);
router.get('/kit/:kitId', kitController.getItem);
router.get('/kit', kitController.getItems);


router.get('/trade/add/:kitId', tradeController.getAdd);
router.post('/trade', kitValidation, tradeController.add);
router.put('/trade/:tradeId', kitValidation, tradeController.edit);
router.delete('/trade/:tradeId', tradeController.delete);
router.get('/trade/:tradeId', tradeController.getItem);
router.get('/trade', tradeController.getItems);

router.get('/wanted/add/:kitId', wantedController.getAdd);
router.post('/wanted', kitValidation, wantedController.add);
router.put('/wanted/:wantedId', kitValidation, wantedController.edit);
router.delete('/wanted/:wantedId', wantedController.delete);
router.get('/wanted/:wantedId', wantedController.getItem);
router.get('/wanted', wantedController.getItems);

router.get('/stolen/add/:kitId', stolenController.getAdd);
router.post('/stolen', kitValidation, stolenController.add);
router.put('/stolen/:stolenId', kitValidation, stolenController.edit);
router.delete('/stolen/:stolenId', stolenController.delete);
router.get('/stolen/:stolenId', stolenController.getItem);
router.get('/stolen', stolenController.getItems);

module.exports = router;
