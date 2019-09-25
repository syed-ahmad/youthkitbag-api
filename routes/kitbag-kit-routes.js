const express = require('express');
const kitController = require('../controllers/kitbag-kit');
const checkValidationResult = require('../middleware/check-validation-result');
const { kitbagValidation, kitValidation } = require('../validators/kitbag-validation');
const hasKit = require('../middleware/has-kit');
const isKitOwner = require('../middleware/is-kit-owner');

const router = express.Router();

// all routes in this module require authentication, route is /kitbag/kit/

router.post('', hasKit, kitbagValidation, kitValidation, checkValidationResult, kitController.add);
router.put('/:kitId', isKitOwner, kitbagValidation, kitValidation, checkValidationResult, kitController.edit);
router.delete('/:kitId', isKitOwner, kitController.delete);
router.get('/containers', kitController.getContainers);
router.get('/:kitId', isKitOwner, kitController.getItem);
router.get('', kitController.getItems);

module.exports = router;
