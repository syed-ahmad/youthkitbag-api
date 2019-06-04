const User = require('../models/user');
const Kit = require('../models/kit');
const ForSale = require('../models/forsale');
const List = require('../models/list');
const Message = require('../models/message');
const Order = require('../models/order');
const Stolen = require('../models/stolen');
const Wanted = require('../models/wanted');

exports.getCollection = (req, res, next) => {
  const collection = req.params.collection;

  User
  .findById(req.userId)
  .then (user => { 
    if (req.userId.toString() !== process.env.ADMIN_USER) {
      const error = new Error('You are not authorized for this feature');
      error.statusCode = 403;
      throw error;
    }
    switch (collection) {
      case 'user':
        return User.find();
      case 'kit':
        return Kit.find();
      case 'forsale':
        return ForSale.find();
      case 'list':
        return List.find();
      case 'message':
        return Message.find();
      case 'order':
        return Order.find();
      case 'stolen':
        return Stolen.find();
      case 'wanted':
        return Wanted.find();
      default:
        break;
    }
  })
  .then(results => {
    res.status(200).json(results);
  })
  .catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};
