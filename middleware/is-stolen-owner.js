const Stolen = require('../models/stolen');

module.exports = (req, res, next) => {
  const stolenId = req.params.stolenId;
  const query = { '_id': stolenId, 'userId': req.userId };

  Stolen.findOne(query)
    .then(stolen => {
      if (!stolen) {
        const error = new Error('The requested stolen item could not be found');
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
}