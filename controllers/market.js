const ForSale = require('../models/forsale');
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
  
  if (sourceType === 'forsale') {
    ForSale.findById(sourceId)
    .then(forsale => {
      if (!forsale) {
        const error = new Error('The requested item for sale could not be found');
        error.statusCode = 500;
        throw error;
      }

      const itemOwner = req.userId.toString() === forsale.userId.toString();

      res.render('market/message', {
        pageTitle: `Create message (item: ${sourceId})`,
        path: '/market/message',
        message: {
          subject: `Re. ${forsale.title} / ${sourceId}`,
          content: '',
          sourceType: sourceType,
          sourceId: sourceId,
          images: forsale.images,
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


