module.exports = (req, res, next) => {
  req.appAdmin = (req.userId.toString() === process.env.ADMIN_USER);

  req.groupAdmin = false;
  const groupId = req.params.groupId;
  if (groupId) {
    Group.findById(groupId)
    .then(group => {
      if (group && group.adminId.toString() === req.userId.toString()) {
        req.groupAdmin = true;
      }
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
  }
  
  next();
}