const ObjectId = require('mongoose').Types.ObjectId;
const Kit = require('../models/kit');
const Trade = require('../models/trade');
const User = require('../models/user');

const filterOptions = [
  { key: 'all', value: 'All' },
  { key: 'title', value: 'Title' },
  { key: 'activity', value: 'Activity' },
  { key: 'group', value: 'Group' },
  { key: 'traded', value: 'All Traded' }
];

// GET request to return kit item as item for trade
exports.getAdd = (req, res, next) => {
  const kitId = req.params.kitId;

  let sourceKit;

  Trade.findOne({ sourceId: new ObjectId(kitId) })
    .then(currentTrade => {
      if (currentTrade && !currentTrade.traded) {
        const error = new Error(
          'The requested item of kit is already listed for trade'
        );
        error.statusCode = 500;
        throw error;
      }
      return Kit.findById(kitId);
    })
    .then(kit => {
      if (kit.status !== 'owned') {
        const error = new Error(
          'Item in kitbag does not have status of Owned, and therefore cannot be listed for trade'
        );
        error.statusCode = 500;
        throw error;
      }
      sourceKit = kit;
      return User.findById(req.userId);
    })
    .then(user => {
      res.status(200).json({
        title: sourceKit.title,
        subtitle: sourceKit.subtitle,
        description: sourceKit.description,
        condition:
          sourceKit.inbag.length > 0 ? sourceKit.inbag[0].condition : 'used',
        askingPrice: 0.0,
        location: {},
        images: sourceKit.images,
        activitys: sourceKit.activitys,
        groups: user.groups
          ? user.groups.map(g => {
              g.groupId, g.name, '2019-01-01';
            })
          : [],
        tradeDetails: [],
        traded: false,
        sourceId: sourceKit._id,
        userId: req.userId
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
  const {
    title,
    subtitle,
    description,
    condition,
    askingPrice,
    location,
    activitys,
    groups,
    traded,
    sourceId
  } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return { ...i, state: 'A' };
  });
  let origImages = req.body.origImages;

  const trade = new Trade({
    title: title,
    subtitle: subtitle,
    description: description,
    condition: condition,
    askingPrice: askingPrice,
    location: location,
    images:
      images && images.length > 0
        ? images
        : origImages
        ? JSON.parse(origImages)
        : [],
    activitys: activitys,
    groups: groups,
    tradeDetails: [],
    traded: traded,
    sourceId: undefined,
    userId: req.userId
  });

  let newTrade;

  if (sourceId) {
    Trade.findOne({ sourceId: new ObjectId(sourceId) })
      .then(existingTrade => {
        if (existingTrade) {
          const error = new Error(
            'The requested item of kit is already listed for trade'
          );
          error.statusCode = 500;
          throw error;
        }
        return Kit.findById(sourceId);
      })
      .then(kit => {
        if (kit.status !== 'owned') {
          const error = new Error(
            'Item in kitbag does not have status of Owned, and therefore cannot be listed for trade'
          );
          error.statusCode = 500;
          throw error;
        }
        kit.status = 'trade';
        return kit.save();
      })
      .then(() => {
        trade.sourceId = sourceId;
        return trade.save();
      })
      .then(result => {
        newTrade = result;
        return User.findById(req.userId);
      })
      .then(user => {
        user.package.size.trade += 1;
        res.status(201).json({
          message: `Trade item "${newTrade.title}" successfully created.`,
          trade: newTrade
        });
        return user.save();
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  } else {
    trade
      .save()
      .then(result => {
        newTrade = result;
        return User.findById(req.userId);
      })
      .then(user => {
        user.package.size.trade += 1;
        res.status(201).json({
          message: `Item for trade "${newTrade.title}" successfully created.`,
          trade: newTrade
        });
        return user.save();
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  }
};

// GET request to get an already existing trade item
exports.getItem = (req, res, next) => {
  const tradeId = req.params.tradeId;

  Trade.findById(tradeId)
    .then(trade => {
      res.status(200).json(trade);
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
  const tradeId = req.params.tradeId;
  const {
    title,
    subtitle,
    description,
    condition,
    askingPrice,
    location,
    activitys,
    groups,
    tradeDetails,
    traded
  } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return { ...i, state: 'A' };
  });

  Trade.findById(tradeId)
    .then(trade => {
      trade.title = title;
      trade.subtitle = subtitle;
      trade.description = description;
      trade.condition = condition;
      trade.askingPrice = askingPrice;
      trade.location = location;
      trade.images = images;
      trade.activitys = activitys;
      trade.groups = groups;
      trade.tradeDetails = tradeDetails;
      trade.traded = traded;
      return trade.save();
    })
    .then(result => {
      res.status(201).json({
        message: `Item for trade "${result.title}" successfully updated.`,
        trade: result
      });
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

  let query = { userId: req.userId, traded: by === 'traded' };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = {
          userId: req.userId,
          traded: false,
          title: { $regex: `.*${search}.*`, $options: 'i' }
        };
        break;
      }
      case 'activity': {
        query = { userId: req.userId, traded: false, activitys: search };
        break;
      }
      case 'group': {
        query = { userId: req.userId, traded: true };
        break;
      }
      case 'traded': {
        query = { userId: req.userId, traded: true };
        break;
      }
      default: {
        query = {
          $and: [
            { userId: req.userId },
            { traded: false },
            {
              $or: [
                { title: { $regex: `.*${search}.*`, $options: 'i' } },
                { activitys: search }
              ]
            }
          ]
        };
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

  Trade.find(query)
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
          search: search,
          options: filterOptions
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
          filterUrl:
            (by ? `&by=${by}` : '') + (search ? `&search=${search}` : '')
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
  const tradeId = req.params.tradeId;

  let sourceId;
  let tradeTitle;

  Trade.findById(tradeId)
    .then(trade => {
      if (trade.traded) {
        const error = new Error(
          'You have already traded this item, so it cannot be deleted'
        );
        error.statusCode = 403;
        throw error;
      }
      sourceId = trade.sourceId;
      tradeTitle = trade.title;
      return trade.delete();
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.package.size.trade -= 1;
      if (user.package.size.trade < 0) {
        user.package.size.trade = 0;
      }
      return user.save();
    })
    .then(() => {
      if (sourceId) {
        Kit.findById(sourceId).then(kit => {
          if (!kit) {
            const error = new Error(
              'The requested item of kit could not be found'
            );
            error.statusCode = 404;
            throw error;
          }
          if (kit.userId.toString() !== req.userId.toString()) {
            const error = new Error(
              'You are not authorized to take any action on this item of related kit'
            );
            error.statusCode = 403;
            throw error;
          }
          kit.status = 'owned';
          return kit.save();
        });
      }
      return;
    })
    .then(() => {
      res.status(201).json({
        message: `Item for trade "${tradeTitle}" successfully deleted.`
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
