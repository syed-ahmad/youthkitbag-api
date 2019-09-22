const express = require('express');
const wantedController = require('../controllers/kitbag-wanted');
const checkValidationResult = require('../middleware/check-validation-result');
const { kitbagValidation, wantedValidation } = require('../validators/kitbag-validation');

const router = express.Router();

// all routes in this module require authentication, route is /kitbag/wanted

router.post('', kitbagValidation, wantedValidation, checkValidationResult, wantedController.add);
router.put('/:wantedId', kitbagValidation, wantedValidation, checkValidationResult, wantedController.edit);
router.delete('/:wantedId', wantedController.delete);
router.get('/add/:kitId', wantedController.getAdd);
router.get('/:wantedId', wantedController.getItem);
router.get('', wantedController.getItems);

module.exports = router;
