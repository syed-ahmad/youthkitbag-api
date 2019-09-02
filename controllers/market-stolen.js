const Stolen = require('../models/stolen');

// GET request a stolen item
exports.getItem = (req, res, next) => {
  const stolenId = req.params.stolenid;

  Stolen
    .findById(stolenId)
    .then(stolen => {
      if (!stolen) {
        const error = new Error('The requested stolen item of kit could not be found');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        stolen: stolen
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request wanted items based on search/pagination
exports.getItems = (req, res, next) => {
  let by = req.query.by;
  let search = req.query.search;
  const page = +req.query.page || 1;
  const itemsPerPage = +req.query.pagesize || 24;
  let totalItems;

  let query = { found: (by === 'found') };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { found: false, title: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { found: false, activitys: search };
        break;
      }
      case 'found': {
        query = { found: true };
        break;
      }
      default: {
        query = { $and: [ { found: false }, { $or: [{ title: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

  Stolen
    .find(query)
    .countDocuments()
    .then(numberOfStolens => {
      totalItems = numberOfStolens;
      return Stolen.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(stolens => {
      res.status(200).json({
        stolens: stolens,
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

