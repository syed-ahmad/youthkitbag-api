const express = require('express');
const marketController = require('../controllers/market');
// const checkValidationResult = require('../middleware/check-validation-result');
// const {
//   marketValidation,
//   tradeValidation,
//   wantedValidation,
//   stolenValidation
// } = require('../validators/market-validation');
const isAuth = require('../middleware/is-auth');
const inGroups = require('../middleware/in-groups');

const router = express.Router();

router.post('/create-message', isAuth, marketController.createMessage);

router.get('', isAuth, inGroups, marketController.getItems);
router.get('/:tradeId', isAuth, inGroups, marketController.getItem);
router.post('/respond/:tradeId', isAuth, inGroups, marketController.offer);

// router.get('/wanted', isAuth, inGroups, wantedController.getItems);
// router.get('/wanted/:wantedId', isAuth, inGroups, wantedController.getItem);
// router.post(
//   '/wanted/offer/:wantedId',
//   isAuth,
//   inGroups,
//   wantedController.offer
// );

// router.get('/stolen', isAuth, inGroups, stolenController.getItems);
// router.get('/stolen/:stolenId', isAuth, inGroups, stolenController.getItem);
// router.post(
//   '/stolen/report/:stolenId',
//   isAuth,
//   inGroups,
//   stolenController.report
// );

module.exports = router;
