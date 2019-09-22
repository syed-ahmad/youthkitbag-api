const express = require('express');
const kitController = require('../controllers/kitbag-kit');
const checkValidationResult = require('../middleware/check-validation-result');
const { kitbagValidation, kitValidation } = require('../validators/kitbag-validation');

const router = express.Router();

// all routes in this module require authentication, route is /kitbag/kit/

router.post('', kitbagValidation, kitValidation, checkValidationResult, kitController.add);
router.put('/:kitId', kitbagValidation, kitValidation, checkValidationResult, kitController.edit);
router.delete('/:kitId', kitController.delete);
router.get('/containers', kitController.getContainers);
router.get('/:kitId', kitController.getItem);
router.get('', kitController.getItems);

module.exports = router;
