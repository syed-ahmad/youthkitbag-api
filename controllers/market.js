const Market = require('../models/market');

const filterOptions = [
  { key: 'all', value: 'All' },
  { key: 'title', value: 'Title' },
  { key: 'activity', value: 'Activity' },
  { key: 'completed', value: 'Completed' }
];

// GET request a market item
exports.getItem = (req, res, next) => {
  console.log('GETITEM', req.params);
  const marketId = req.params.marketId;
  const groupArray = req.inGroups.map(g => g._id.toString());

  Market.findById(marketId)
    .then(market => {
      if (!market) {
        const error = new Error('The requested market could not be found');
        error.statusCode = 500;
        throw error;
      }
      const groupCheck = market.groups.map(g => g._id.toString());
      console.log('GRPCHECK', groupCheck);
      const inItemGroup =
        groupCheck.filter(g => groupArray.includes(g)).length > 0;
      if (!inItemGroup) {
        const error = new Error(
          'You are not authorised to view the requested market'
        );
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        _id: market._id,
        title: market.title,
        subtitle: market.subtitle,
        description: market.description,
        condition: market.condition,
        marketPrice: market.marketPrice,
        images: market.images,
        activitys: market.activitys,
        responseDetails: market.responseDetails.filter(
          t => t.fromUserId.toString() == req.userId.toString()
        )
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request market items based on search/pagination
exports.getItems = (req, res, next) => {
  console.log('GETITEMS');
  let by = req.query.by;
  let search = req.query.search;
  const page = +req.query.page || 1;
  const itemsPerPage = +req.query.pagesize || 24;
  let totalItems;

  const groupArray = req.inGroups.map(g => g._id);

  let query = {
    completed: by === 'completed',
    userId: { $ne: req.userId },
    groups: {
      $elemMatch: {
        _id: groupArray,
        include: true,
        available: { $lt: new Date() }
      }
    }
  };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { ...query, title: { $regex: `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { ...query, activitys: search };
        break;
      }
      default: {
        query = {
          $and: [
            { ...query },
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
  console.log('QUERY', query);

  Market.find(query)
    .countDocuments()
    .then(numberOfMarkets => {
      console.log('NUM', numberOfMarkets);
      totalItems = numberOfMarkets;
      return Market.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(markets => {
      const allMarkets = markets.map(t => {
        let nt = {};
        nt._id = t._id;
        nt.title = t.title;
        nt.subtitle = t.subtitle;
        nt.marketPrice = t.marketPrice;
        nt.images = t.images;
        return nt;
      });
      res.status(200).json({
        items: allMarkets,
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

// POST request to submit market respond
exports.respond = (req, res, next) => {
  const marketId = req.params.marketId;
  const { responseOn, details, responsePrice } = req.body;

  const responseDetail = {
    responseOn: responseOn,
    fromUserId: req.userId,
    details: details,
    responsePrice: responsePrice,
    completed: false,
    legit: true,
    messages: []
  };

  console.log('responseDetail', responseDetail);

  Market.findById(marketId)
    .then(market => {
      if (!market) {
        const error = new Error('The requested market item could not be found');
        error.statusCode = 500;
        throw error;
      }
      market.responseDetails.push(responseDetail);
      return market.save();
    })
    .then(result => {
      res.status(201).json({
        message: `Thank you. Your responseDetail has been submitted on this item "${result.title}".`
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createMessage = (req, res, next) => {
  const sourceType = req.body.sourceType;
  const sourceId = req.body.sourceId;

  if (!sourceType || !sourceId) {
    const error = new Error('Message must be created in relation to an item');
    error.httpStatusCode = 500;
    return next(error);
  }

  if (sourceType === 'market') {
    Market.findById(sourceId).then(market => {
      if (!market) {
        const error = new Error(
          'The requested item for market could not be found'
        );
        error.statusCode = 500;
        throw error;
      }

      res.render('market/message', {
        pageTitle: `Create message (item: ${sourceId})`,
        path: '/market/message',
        message: {
          subject: `Re. ${market.title} / ${sourceId}`,
          content: '',
          sourceType: sourceType,
          sourceId: sourceId,
          images: market.images,
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
