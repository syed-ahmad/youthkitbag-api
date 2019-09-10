const Trade = require('../models/trade');

const filterOptions = [ { key: 'all', value: 'All' }, { key: 'title', value: 'Title' }, { key: 'activity', value: 'Activity' }, { key: 'group', value: 'Group' }, { key: 'traded', value: 'All Traded' } ];

// GET request a trade item
exports.getItem = (req, res, next) => {
  const tradeId = req.params.tradeid;
  
  Trade
    .findById(tradeId)
    .then(trade => {
      if (!trade) {
        const error = new Error('The requested for trade item of kit could not be found');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        trade: trade
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request trade items based on search/pagination
exports.getItems = (req, res, next) => {
  console.log('QUERY', req.query);
  let by = req.query.by;
  let search = req.query.search;
  const page = +req.query.page || 1;
  const itemsPerPage = +req.query.pagesize || 24;
  let totalItems;

  let query = { traded: (by === 'hasbeentraded') };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { traded: false, title: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { traded: false, activitys: search };
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
        query = { $and: [ { traded: false }, { $or: [{ title: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

  Trade
    .find(query)
    .countDocuments()
    .then(numberOfTrades => {
      totalItems = numberOfTrades;
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

