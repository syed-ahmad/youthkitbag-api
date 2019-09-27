module.exports = (req, res, next) => {
  if (!req.groupMember) {
    const error = new Error('You are not authorised as a group member');
    error.statusCode = 401;
    next(error);
  } else {
    next();
  }
};
