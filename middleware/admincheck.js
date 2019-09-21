const Group = require('../models/group');

module.exports = (req, res, next) => {
  req.appAdmin = (req.userId.toString() === process.env.ADMIN_USER);
  req.groupAdmin = false;
  const groupId = req.params.groupId;
  Group.findById(groupId)
    .then(group => {
      console.log('GROUP', group);
      if (group && group.adminId.toString() === req.userId.toString()) {
        console.log('GROUP ADMIN', group);
        req.groupAdmin = true;
      }
      next();
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}