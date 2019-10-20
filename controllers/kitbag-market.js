const ObjectId = require('mongoose').Types.ObjectId;
const Kit = require('../models/kit');
const Market = require('../models/market');
const User = require('../models/user');
const { mapGroups } = require('../util/maps');

const filterOptions = [
  { key: 'all', value: 'All' },
  { key: 'title', value: 'Title' },
  { key: 'activity', value: 'Activity' },
  { key: 'completed', value: 'Completed' }
];

// GET request to return kit item as item for market
exports.getAdd = (req, res, next) => {
  const kitId = req.params.kitId;
  const marketType = req.params.marketType;

  let sourceKit;

  Market.findOne({ sourceId: new ObjectId(kitId), marketType: marketType })
    .then(currentMarket => {
      if (currentMarket && !currentMarket.completed) {
        const error = new Error(
          `The requested item of kit is already actively listed as ${marketType} on the market place`
        );
        error.statusCode = 500;
        throw error;
      }
      return Kit.findById(kitId);
    })
    .then(kit => {
      if (kit.status !== 'owned') {
        const error = new Error(
          'Item in kitbag does not have status of Owned, and therefore cannot be listed on the market place'
        );
        error.statusCode = 500;
        throw error;
      }
      sourceKit = kit;
      return User.findById(req.userId).populate('profile.groups');
    })
    .then(user => {
      res.status(200).json({
        title: sourceKit.title,
        marketType: marketType,
        subtitle: sourceKit.subtitle,
        description: sourceKit.description,
        location: {},
        images: sourceKit.images,
        activitys: sourceKit.activitys,
        condition:
          sourceKit.inbag.length > 0 ? sourceKit.inbag[0].condition : 'used',
        security: sourceKit.security,
        tracking: '',
        occurredOn: new Date(),
        freeTrade: false,
        marketPrice: 0.0,
        completed: false,
        sourceId: sourceKit._id,
        userId: req.userId,
        groups: mapGroups(user.profile, sourceKit.activitys, req.userId),
        responseDetails: []
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// POST request to add a new item into market
exports.add = (req, res, next) => {
  const {
    title,
    marketType,
    subtitle,
    description,
    location,
    activitys,
    condition,
    security,
    tracking,
    occurredOn,
    freeTrade,
    marketPrice,
    completed,
    sourceId,
    groups
  } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return { ...i, state: 'A' };
  });
  let origImages = req.body.origImages;

  const market = new Market({
    title: title,
    marketType: marketType,
    subtitle: subtitle,
    description: description,
    location: location,
    images:
      images && images.length > 0
        ? images
        : origImages
        ? JSON.parse(origImages)
        : [],
    activitys: activitys,
    condition: condition,
    security: security,
    tracking: tracking,
    occurredOn: occurredOn,
    freeTrade: freeTrade,
    marketPrice: marketPrice,
    completed: completed,
    sourceId: undefined,
    userId: req.userId,
    groups: groups,
    responseDetails: []
  });

  let newMarket;
  const freeMarketTypes = ['stolen', 'lost', 'found'];

  if (sourceId) {
    Market.findOne({ sourceId: new ObjectId(sourceId), marketType: marketType })
      .then(existingMarket => {
        if (existingMarket && !existingMarket.completed) {
          const error = new Error(
            `The requested item of kit is already actively listed as ${marketType} on the market place`
          );
          error.statusCode = 500;
          throw error;
        }
        return Kit.findById(sourceId);
      })
      .then(kit => {
        if (kit.status !== 'owned') {
          const error = new Error(
            'Item in kitbag does not have status of Owned, and therefore cannot be listed on the market place'
          );
          error.statusCode = 500;
          throw error;
        }
        kit.status = marketType;
        return kit.save();
      })
      .then(() => {
        market.sourceId = sourceId;
        return market.save();
      })
      .then(result => {
        newMarket = result;
        return User.findById(req.userId);
      })
      .then(user => {
        if (!freeMarketTypes.includes(marketType)) {
          user.package.size.market += 1;
        }
        res.status(201).json({
          message: `Item "${newMarket.title}" successfully added to the market place.`,
          market: newMarket
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
    market
      .save()
      .then(result => {
        newMarket = result;
        return User.findById(req.userId);
      })
      .then(user => {
        if (!freeMarketTypes.includes(marketType)) {
          user.package.size.market += 1;
        }
        res.status(201).json({
          message: `Item "${newMarket.title}" successfully added to the market place.`,
          market: newMarket
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

// GET request to get an already existing market item
exports.getItem = (req, res, next) => {
  const marketId = req.params.marketId;

  Market.findById(marketId)
    .populate('responseDetails.fromUserId', 'profile.username')
    .then(market => {
      res.status(200).json(market);
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
  const marketId = req.params.marketId;
  const {
    title,
    subtitle,
    description,
    location,
    activitys,
    condition,
    security,
    tracking,
    occurredOn,
    freeTrade,
    marketPrice,
    completed,
    groups,
    responseDetails
  } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return { ...i, state: 'A' };
  });

  Market.findById(marketId)
    .then(market => {
      market.title = title;
      market.subtitle = subtitle;
      market.description = description;
      market.location = location;
      market.images = images;
      market.activitys = activitys;
      market.condition = condition;
      market.security = security;
      market.tracking = tracking;
      market.occurredOn = occurredOn;
      market.freeTrade = freeTrade;
      market.marketPrice = marketPrice;
      market.groups = groups;
      market.responseDetails = responseDetails;
      market.completed = completed;
      return market.save();
    })
    .then(result => {
      res.status(201).json({
        message: `Item "${result.title}" on the market place successfully updated.`,
        market: result
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
  console.log('GETITEMS', req.query);
  let by = req.query.by;
  let search = req.query.search;
  const page = +req.query.page || 1;
  const itemsPerPage = +req.query.pagesize || 24;
  let totalItems;

  let query = { userId: req.userId, completed: by === 'completed' };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = {
          userId: req.userId,
          completed: false,
          title: { $regex: `.*${search}.*`, $options: 'i' }
        };
        break;
      }
      case 'activity': {
        query = { userId: req.userId, completed: false, activitys: search };
        break;
      }
      case 'group': {
        query = { userId: req.userId, completed: true };
        break;
      }
      case 'completed': {
        query = { userId: req.userId, completed: true };
        break;
      }
      default: {
        query = {
          $and: [
            { userId: req.userId },
            { completed: false },
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

  Market.find(query)
    .countDocuments()
    .then(numberOfItems => {
      console.log('NUM', numberOfItems);
      totalItems = numberOfItems;
      return Market.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(markets => {
      res.status(200).json({
        items: markets,
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

// POST request to delete market item from kitbag
exports.delete = (req, res, next) => {
  const marketId = req.params.marketId;

  let sourceId;
  let marketTitle;

  Market.findById(marketId)
    .then(market => {
      if (market.completed) {
        const error = new Error(
          'You have already completed this item, so it cannot be deleted'
        );
        error.statusCode = 403;
        throw error;
      }
      sourceId = market.sourceId;
      marketTitle = market.title;
      return market.delete();
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.package.size.market -= 1;
      if (user.package.size.market < 0) {
        user.package.size.market = 0;
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
        message: `Item "${marketTitle}" on the market place successfully deleted.`
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
