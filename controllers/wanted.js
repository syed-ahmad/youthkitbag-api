const Wanted = require('../models/wanted');

// GET request a wanted item
exports.getItem = (req, res, next) => {
  const wantedId = req.params.wantedid;
  
  Wanted
    .findById(wantedId)
    .then(wanted => {
      if (!wanted) {
        const error = new Error('The requested wanted item of kit could not be found');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        wanted: wanted
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

  let query = { obtained: (by === 'obtained') };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { obtained: false, title: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { obtained: false, activitys: search };
        break;
      }
      case 'obtained': {
        query = { obtained: true };
        break;
      }
      default: {
        query = { $and: [ { obtained: false }, { $or: [{ title: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

  Wanted
    .find(query)
    .countDocuments()
    .then(numberOfWanteds => {
      totalItems = numberOfWanteds;
      return Wanted.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(wanteds => {
      res.status(200).json({
        wanteds: wanteds,
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

