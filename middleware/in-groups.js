const User = require('../models/user');

module.exports = (req, res, next) => {
  const userId = req.userId;
  if (userId) {
    User.findById(userId)
      .populate('profile.groups', 'name members')
      .then(user => {
        const groups = user.profile.groups.map(g => {
          return {
            _id: g._id,
            name: g.name,
            members: g.members
              .filter(m => m.user.toString() === userId.toString())
              .map(m => {
                return { state: m.state, permissions: m.permissions };
              })
          };
        });
        req.inGroups = groups
          .filter(
            g =>
              g.members[0].state === 'approved' &&
              g.members[0].permissions.includes('member')
          )
          .map(g => {
            return { _id: g._id, name: g.name };
          });
        next();
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  } else {
    req.inGroups = [];
    next();
  }
};
