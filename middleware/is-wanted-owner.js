const Wanted = require("../models/wanted");

module.exports = (req, res, next) => {
  const wantedId = req.params.wantedId;
  const query = { _id: wantedId, userId: req.userId };

  Wanted.findOne(query)
    .then(wanted => {
      if (!wanted) {
        const error = new Error("The requested wanted item could not be found");
        error.statusCode = 404;
        throw error;
      }
      next();
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
