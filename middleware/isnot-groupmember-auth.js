const Group = require('../models/group');

module.exports = (req, res, next) => {
  // const groupId = req.params.groupId;
  // Group.findById(groupId)
  //   .then(group => {
  //     if (!group) {
  //       const error = new Error('The requested group does not exist');
  //       error.statusCode = 401;
  //       throw error;
  //     }
  //     if (group.adminId.toString() !== req.userId.toString()) {
  //       const error = new Error('You are not recognised as the group administrator');
  //       error.statusCode = 401;
  //       throw error;
  //     }
  //     next();
  //   })
  //   .catch(err => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
  next();
}