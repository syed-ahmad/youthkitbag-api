const Trade = require("../models/trade");

module.exports = (req, res, next) => {
  const tradeId = req.params.tradeId;
  const query = { _id: tradeId, userId: req.userId };

  Trade.findOne(query)
    .then(trade => {
      if (!trade) {
        const error = new Error("The requested trade item could not be found");
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
