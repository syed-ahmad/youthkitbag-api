module.exports = (req, res, next) => {
  if (!req.groupAdmin) {
    const error = new Error("You are not authorised as a group administrator");
    error.statusCode = 401;
    next(error);
  } else {
    next();
  }
};
