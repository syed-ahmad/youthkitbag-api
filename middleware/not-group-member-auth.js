module.exports = (req, res, next) => {
  if (req.groupMember) {
    const error = new Error('You are already a member of this group');
    error.statusCode = 404;
    next(error);
  } else if (req.groupMemberState) {
    const error = new Error(
      `You do not have the ability to change your membership status. Your current membership status within this group is "${req.groupMemberState}"`
    );
    error.statusCode = 404;
    next(error);
  } else {
    next();
  }
};
