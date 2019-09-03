const express = require('express');
const { body } = require('express-validator/check');

const groupController = require('../controllers/group');
const isGroupAdminAuth = require('../middleware/is-groupadmin-auth');;
const isAppAdminAuth = require('../middleware/is-appadmin-auth');;

const router = express.Router();

const groupValidation = [
  body('name', 'Please enter a name of at least 5 characters').isLength({min: 5})
];

router.post('', groupValidation, groupController.add);
router.get('/:groupId', groupController.get);
// router.get('/group/:groupId/members', isGroupAdminAuth, groupController.getMembers);

router.put('/details/:groupId', isAppAdminAuth, groupController.editDetails);
router.get('/details/:groupId', isAppAdminAuth, groupController.getDetails);

router.get('/search', groupController.getItems);

router.get('/:groupId', isGroupAdminAuth, groupController.getItem);

module.exports = router;
