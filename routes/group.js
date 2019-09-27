const express = require("express");
const groupController = require("../controllers/group");
const groupCheck = require("../middleware/group-check");
const isGroupMemberAuth = require("../middleware/is-group-member-auth");
const isNotGroupMemberAuth = require("../middleware/not-group-member-auth");
const isGroupAdminAuth = require("../middleware/is-group-admin-auth");
const isAppAdminAuth = require("../middleware/is-app-admin-auth");
const hasGroupAdmin = require("../middleware/has-group-admin");
const hasGroupMember = require("../middleware/has-group-member");
const checkValidationResult = require("../middleware/check-validation-result");
const { groupValidation } = require("../validators/group-validation");
const { searchValidation } = require("../validators/search-validation");

const router = express.Router();

// ordinary user can create a group (to state 'awaiting approval'),
// if they are not past the limit of groups that they can be admin for
// if they are not past the limit of groups that they can be member of
router.post(
  "",
  hasGroupAdmin,
  hasGroupMember,
  groupValidation,
  checkValidationResult,
  groupController.add
);

// group admin user can request to deactivate a group (to state 'awaiting deactivation', when state is not 'blocked', all members will be )
// they must be group admin for the defined group
// their group admin count will NOT be released (to prevent autobots creating groups)

router.put(
  "/:groupId/status",
  groupCheck,
  isAppAdminAuth,
  groupController.editStatus
);

// group admin users can change the status of a member (to state 'apply,approved,blocked,suspended,rejected,left')
// they must be group admin for the defined group
// the members group count will ONLY be released if rejected/left, and the membership relationship will be hidden
router.put(
  "/:groupId/members/:memberId/:state",
  groupCheck,
  isGroupAdminAuth,
  groupController.editMemberState
);

// users can request to join a group
// they must not be in the group
// if they are not past the limit of groups that hey can be member of
// the members group count will ONLY be released if rejected, and the membership relationship will be hidden
router.post(
  "/:groupId/members/join",
  groupCheck,
  hasGroupMember,
  isNotGroupMemberAuth,
  groupController.joinMember
);

// users can leave a group
// they must not be in the group
// if they are not past the limit of groups that hey can be member of
// the members group count will be released, and the membership relationship will be hidden ('left')
router.put(
  "/:groupId/members/leave",
  groupCheck,
  isGroupMemberAuth,
  groupController.leaveMember
);

// group admin user can update certain details within a group (when state is not 'blocked')
// they must be group admin for the defined group
router.put(
  "/:groupId",
  groupCheck,
  isGroupAdminAuth,
  groupValidation,
  checkValidationResult,
  groupController.edit
);

// groupCheck is used to apply appadmin / groupadmin reference on returned object
// so that ui can display additional options
router.get("/search", searchValidation, groupController.getItems);

// group member users can see other members
// they must be in the group or app admin
router.get(
  "/:groupId/members",
  groupCheck,
  isGroupMemberAuth,
  searchValidation,
  groupController.getMembers
);

// all users can get a group but the response will be different
router.get("/:groupId", groupCheck, groupController.getItem);

module.exports = router;
