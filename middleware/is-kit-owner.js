const Kit = require("../models/kit");

module.exports = (req, res, next) => {
  const kitId = req.params.kitId;
  const query = { _id: kitId, userId: req.userId };

  Kit.findOne(query)
    .then(kit => {
      if (!kit) {
        const error = new Error("The requested kit item could not be found");
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
