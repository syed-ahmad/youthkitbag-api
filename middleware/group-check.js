const Group = require('../models/group');

module.exports = (req, res, next) => {
  req.appAdmin = req.userId.toString() === process.env.ADMIN_USER;
  req.groupAdmin = false;
  req.groupMember = false;

  const groupId = req.params.groupId;

  if (groupId) {
    const memberId = req.userId;

    const query = { _id: groupId };
    const match = { members: { $elemMatch: { user: memberId } } };

    Group.findOne(query, match)
      .then(group => {
        if (!group) {
          const error = new Error('The requested group could not be found');
          error.statusCode = 404;
          throw error;
        }
        if (group.members.length === 0) {
          next();
        } else if (group.members[0].permissions.length === 0) {
          req.groupMemberState = group.members[0].state;
          next();
        } else {
          req.groupAdmin = group.members[0].permissions.includes('admin');
          req.groupMember = group.members[0].permissions.includes('member');
          next();
        }
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  } else {
    next();
  }
};
