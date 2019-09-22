const express = require('express');
const stolenController = require('../controllers/kitbag-stolen');
const checkValidationResult = require('../middleware/check-validation-result');
const { kitbagValidation, stolenValidation } = require('../validators/kitbag-validation');

const router = express.Router();

// all routes in this module require authentication, route is /kitbag/stolen

router.post('', kitbagValidation, stolenValidation, checkValidationResult, stolenController.add);
router.put('/:stolenId', kitbagValidation, stolenValidation, checkValidationResult, stolenController.edit);
router.delete('/:stolenId', stolenController.delete);
router.get('/add/:kitId', stolenController.getAdd);
router.get('/:stolenId', stolenController.getItem);
router.get('', stolenController.getItems);

module.exports = router;
