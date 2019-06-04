const ForSale = require('../models/forsale');

// GET request a forsale item
exports.getItem = (req,res, next) => {
  const forsaleId = req.params.forsaleid;
  
  ForSale
    .findById(forsaleId)
    .then(forsale => {
      if (!forsale) {
        const error = new Error('The requested for sale item of kit could not be found');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        forsale: forsale
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request forsale items based on search/pagination
exports.getItems = (req, res, next) => {
  let by = req.query.by;
  let search = req.query.search;
  const page = +req.query.page || 1;
  const itemsPerPage = +req.query.pagesize || 24;
  let totalItems;

  let query = { hassold: (by === 'hassold') };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { hassold: false, title: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { hassold: false, activitys: search };
        break;
      }
      case 'hassold': {
        query = { hassold: true };
        break;
      }
      default: {
        query = { $and: [ { hassold: false }, { $or: [{ title: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

  ForSale
    .find(query)
    .countDocuments()
    .then(numberOfForsales => {
      totalItems = numberOfForsales;
      return ForSale.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(forsales => {
      res.status(200).json({
        forsales: forsales,
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
          filterUrl: `&by=${by}&search=${search}`
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

