module.exports = (req, res, next) => {
  if (req.groupMember) {
    const error = new Error('You are already a member of this group');
    error.statusCode = 401;
    next(error);
  } else {
    next();
  }
}