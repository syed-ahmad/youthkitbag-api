const ObjectId = require('mongoose').Types.ObjectId; 
const Kit = require('../models/kit');
const Trade = require('../models/trade');
const User = require('../models/user');
const { validationResult} = require('express-validator/check');

// GET request to return kit item as item for sale
exports.getAdd = (req, res, next) => {
  const kitId = req.params.kitId;

  Trade.findOne({ sourceId: new ObjectId(kitId) })
    .then(currentSale => {
      if (currentSale) {
        const error = new Error('The requested item of kit is already listed for sale');
        error.statusCode = 500;
        throw error;
      }
      return Kit.findById(kitId);
    })
    .then(kit => {
      if (!kit) {
        const error = new Error('The requested item of kit could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (kit.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to sell this item of kit');
        error.statusCode = 403;
        throw error;
      }
      if (kit.status !== 0) {
        const error = new Error('Item in kitbag does not have status of Owned, and therefore cannot be listed for sale');
        error.statusCode = 500;
        throw error;
      }
      if (req.user.package.max.trade <= req.user.package.size.trade) {
        const error = new Error('You have already reached the limits of your trade package. Please upgrade to sell more items.');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        trade: {
          title: kit.title,
          subtitle: kit.subtitle,
          description: kit.description,
          condition: kit.inbag.length > 0 ? kit.inbag[0].condition : 'used',
          askingPrice: 0.00,
          images: kit.images,
          activitys: kit.activitys,
          hasSold: false,
          sourceId: kit._id,
          userId: req.userId
        },
        origImages: JSON.stringify(kit.images),
        errors: [],
        editing: false
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// POST request to add a new item into trade
exports.add = (req, res, next) => {
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const description = req.body.description;
  const condition = req.body.condition;
  const askingPrice = +req.body.askingPrice;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.split(',').map(s => s.trim().toLowerCase());
  }

  const hasSold = req.body.hasSold;
  const sourceId = req.body.sourceId;

  let images = req.files;
  if (images && images.length > 0) {
    images = images.map(i => { 
      const image = {};
      image.image = i.key; 
      image.imageUrl = i.location;
      return image;
    });
  }
  let origImages = req.body.origImages;
 
  const validation = validationResult(req);
  let errors = [];
  if (!validation.isEmpty()) {
    errors = validation.array();
  }
  if (errors.length) {
    return res.status(422).json({
      trade: {
        title: title,
        subtitle: subtitle,
        description: description,
        askingPrice: askingPrice,
        condition: coindition,
        activitys: activitys,
        hasSold: hasSold,
        sourceId: sourceId,
        userId: req.userId
      },
      errors: errors,
      editing: false
    });
  }

  const trade = new Trade({
    title: title,
    subtitle: subtitle,
    description: description,
    condition: condition,
    askingPrice: askingPrice,
    activitys: activitys,
    hasSold: hasSold,
    sourceId: sourceId,
    userId: req.userId
  });


  if (images.length > 0) {
    trade.images = images;
  } else {
    //TODO: Can we make copies of images on s3 to remove dependency
    trade.images = JSON.parse(origImages);
  }

  let newTrade;

  Trade.findOne({ sourceId: new ObjectId(sourceId) })
    .then(currentSale => {
      if (currentSale) {
        const error = new Error('The requested item of kit is already listed for sale');
        error.statusCode = 500;
        throw error;
      }
      return Kit.findById(sourceId);
    })
    .then(kit => {
      if (!kit) {
        const error = new Error('The requested item of kit could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (kit.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to sell this item of kit');
        error.statusCode = 403;
        throw error;
      }
      if (kit.status !== 0) {
        const error = new Error('Item in kitbag does not have status of Owned, and therefore cannot be listed for sale');
        error.statusCode = 500;
        throw error;
      }
      if (req.user.package.max.trade <= req.user.package.size.trade) {
        const error = new Error('You have already reached the limits of your trade package. Please upgrade to sell more items.');
        error.statusCode = 500;
        throw error;
      }
      kit.status = 1;
      return kit.save();
    })
    .then(() => {
      return trade.save();
    })
    .then(result => {
      newTrade = result;
      return User.findById(req.userId);
    })
    .then(user => { 
      user.package.size.trade += 1;
      return user.save();
    })
    .then(user => {
      req.session.user = user;
      return req.session.save(err => {
        console.log(err);
      });
    })
    .then(err => {
      res.status(201).json({ trade: newTrade });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request to get an already existing trade item
exports.getItem = (req, res, next) => {
  const tradeId = req.params.tradeId;

  Trade.findById(tradeId)
    .then(trade => {
      if (!trade) {
        const error = new Error('For sale item not found');
        error.statusCode = 404;
        throw error;
      }
      if (trade.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit the item being sold');
        error.statusCode = 403;
        throw error;
      }
      res.status(200).json({
        trade: trade,
        origImages: JSON.stringify(trade.images),
        errors: [],
        editing: true
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// POST request to save edited changes to existing wanted item
exports.edit = (req, res, next) => {
  const tradeId = req.body.tradeId;
  const sourceId = req.body.sourceId;
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const description = req.body.description;
  const condition = req.body.condition;
  const askingPrice = +req.body.askingPrice;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.split(',').map(s => s.trim().toLowerCase());
  }

  const hasSold = req.body.hasSold;

  let images = req.files;
  if (images && images.length > 0) {
    images = images.map(i => { 
      const image = {};
      image.image = i.key; 
      image.imageUrl = i.location;
      return image;
    });
  }
  
  const validation = validationResult(req);
  let errors = [];
  if (!validation.isEmpty()) {
    errors = validation.array();
  }
  if (errors.length) {
    return res.status(422).json({
      trade: {
        _id: tradeId,
        title: title,
        subtitle: subtitle,
        description: description,
        askingPrice: askingPrice,
        condition: condition,
        activitys: activitys,
        hasSold: hasSold,
        sourceId: sourceId,
        userId: req.userId
      },
      errors: errors,
      editing: true
    });
  }

  Trade.findById(tradeId)
    .then(trade => {
      if (!trade) {
        const error = new Error('For sale item not found');
        error.statusCode = 404;
        throw error;
      }
      if (trade.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit the kit being sold');
        error.statusCode = 403;
        throw error;
      }
      trade.title = title;
      trade.subtitle = subtitle;
      trade.description = description;
      trade.askingPrice = askingPrice;
      trade.condition = condition;
      trade.activitys = activitys;
      trade.hasSold = hasSold;
      if (images.length > 0) {
        trade.images.forEach((img, i) => {
          //TODO: 
          //fileHelper.checkSourceAndDeleteImage(img.image);
        });
        trade.images = images;
      }
      return trade.save()
    })
    .then(result => {
      res.status(200).json({ trade: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request to return page of items from users kitbag
exports.getItems = (req, res, next) => {
  let by = req.query.by;
  let search = req.query.search;
  const page = +req.query.page || 1;
  const itemsPerPage = +req.query.pagesize || 24;
  let totalItems;

  let query = { userId: req.userId, hasSold: (by === 'hassold') };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { userId: req.userId, hasSold: false, title: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { userId: req.userId, hasSold: false, activitys: search };
        break;
      }
      case 'hasSold': {
        query = { userId: req.userId, hasSold: true };
        break;
      }
      default: {
        query = { $and: [ { userId: req.userId }, { hasSold: false }, { $or: [{ title: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

  Trade
    .find(query)
    .countDocuments()
    .then(numberOfItems => {
      totalItems = numberOfItems;
      return Trade.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(trades => {
      res.status(200).json({
        trades: trades,
        filter: {
          by: by,
          search: search  
        },
        pagination: {
          totalItems: totalItems,
          itemsPerPage: itemsPerPage,
          currentPage: page,
          hasNextPage: itemsPerPage * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / itemsPerPage),
          filterUrl: (by ? `&by=${by}` : '') + (search ? `&search=${search}` : '')
        }
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// POST request to delete trade item from kitbag
exports.delete = (req, res, next) => {
  const tradeId = req.body.tradeId;
  const confirm = req.body.confirm;

  let tradeItem = {};

  Trade.findById(tradeId)
    .then(trade => {
      if (!trade) {
        const error = new Error('The requested sale item could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (trade.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to delete this sale item');
        error.statusCode = 403;
        throw error;
      }
      if (confirm !== 'delete') {
        const error = new Error('You did not confirm the delete');
        error.statusCode = 400;
        throw error;
      }
      tradeItem = trade;
      return Kit.findById(trade.sourceId);
    })
    .then(kit => {
      if (!kit) {
        const error = new Error('The requested item of kit could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (kit.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to take any action on this item of related kit');
        error.statusCode = 403;
        throw error;
      }
      kit.status = 0;
      return kit.save();
    })
    .then(result => {
      if (tradeItem.images) {
        tradeItem.images.forEach((img, i) => {
          //TODO: 
          //fileHelper.checkSourceAndDeleteImage(img.image);
        });
      }
      return Trade.deleteOne({ _id: tradeId, userId: req.userId });
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => { 
      user.package.size.trade -= 1;
      if (user.package.size.trade < 0) {
        user.package.size.trade = 0;
      }
      return user.save();
    })
    .then(user => {
      req.session.user = user;
      return req.session.save(err => {
        console.log(err);
      });
    })
    .then(err => {
      res.status(200).json({ message: 'For sale item deleted' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
