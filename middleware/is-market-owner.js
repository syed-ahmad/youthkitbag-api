const Market = require('../models/market');

module.exports = (req, res, next) => {
  const marketId = req.params.marketId;
  const query = { _id: marketId, userId: req.userId };

  Market.findOne(query)
    .then(market => {
      if (!market) {
        const error = new Error(
          'The requested market place item could not be found'
        );
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
