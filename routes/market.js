const express = require('express');
const marketController = require('../controllers/market');
// const checkValidationResult = require('../middleware/check-validation-result');
// const {
//   marketValidation,
//   marketValidation,
//   wantedValidation,
//   stolenValidation
// } = require('../validators/market-validation');
const isAuth = require('../middleware/is-auth');
const inGroups = require('../middleware/in-groups');

const router = express.Router();

router.post('/create-message', isAuth, marketController.createMessage);

router.get('', isAuth, inGroups, marketController.getItems);
router.get('/:marketId', isAuth, inGroups, marketController.getItem);
router.post('/respond/:marketId', isAuth, inGroups, marketController.respond);

module.exports = router;
