const express = require('express');
const { body } = require('express-validator');
const groupController = require('../controllers/group');
const isGroupAdminAuth = require('../middleware/is-groupadmin-auth');;
const isAppAdminAuth = require('../middleware/is-appadmin-auth');;
const adminCheck = require('../middleware/admincheck');
const { commaToArray, lowTagFormat } = require('../util/sanitizer');

const router = express.Router();

const groupValidation = [
  body('name', 'Please enter a name of at least 5 characters').trim().isLength({min: 5}),
  body('tagline', 'Please enter a tagline of at least 5 characters').trim().customSanitizer(lowTagFormat).isLength({min: 5}),
  body('description', 'Please enter a description of at least 10 characters').trim().isLength({min: 10}),
  body('email', 'Please enter a valid email').normalizeEmail().isEmail(),
  body('website', 'Please enter a valid website').isURL().customSanitizer(value => (value.startsWith('http')) ? value : `http://${value}`),
  body('activitys', 'Please specify at least one activity').customSanitizer(commaToArray).isArray({min: 1}),
  body('activitys.*').customSanitizer(lowTagFormat),
];

router.post('', groupValidation, groupController.add);
// router.get('/group/:groupId/members', isGroupAdminAuth, groupController.getMembers);

router.put('/status/:groupId', isAppAdminAuth, groupController.editStatus);
router.put('/details/:groupId', isAppAdminAuth, groupController.editDetails);
router.get('/details/:groupId', isAppAdminAuth, groupController.getDetails);

router.get('/search', adminCheck, groupController.getItems);

//router.get('/:groupId', isGroupAdminAuth, groupController.getItem);

router.get('/:groupId', adminCheck, groupController.get);

module.exports = router;
