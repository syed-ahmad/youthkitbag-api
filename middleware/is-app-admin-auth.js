module.exports = (req, res, next) => {
  if (req.userId.toString() !== process.env.ADMIN_USER) {
    const error = new Error("You are not authorized for this feature");
    error.statusCode = 403;
    throw error;
  }

  req.appAdmin = true;
  next();
};
