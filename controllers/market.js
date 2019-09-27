const Trade = require('../models/trade');
const Message = require('../models/message');
const User = require('../models/user');

exports.createMessage = (req, res, next) => {
  const sourceType = req.body.sourceType;
  const sourceId = req.body.sourceId;

  if (!sourceType || !sourceId) {
    const error = new Error('Message must be created in relation to an item');
    error.httpStatusCode = 500;
    return next(error);
  }

  if (sourceType === 'trade') {
    Trade.findById(sourceId).then(trade => {
      if (!trade) {
        const error = new Error(
          'The requested item for trade could not be found'
        );
        error.statusCode = 500;
        throw error;
      }

      const itemOwner = req.userId.toString() === trade.userId.toString();

      res.render('market/message', {
        pageTitle: `Create message (item: ${sourceId})`,
        path: '/market/message',
        message: {
          subject: `Re. ${trade.title} / ${sourceId}`,
          content: '',
          sourceType: sourceType,
          sourceId: sourceId,
          images: trade.images,
          hasSent: false,
          hasRead: false
        },
        errors: []
      });
    });
  } else {
    const error = new Error('No message can be created');
    error.httpStatusCode = 500;
    return next(error);
  }
};
