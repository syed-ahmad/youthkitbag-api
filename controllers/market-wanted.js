const Wanted = require('../models/wanted');

const filterOptions = [ { key: 'all', value: 'All' }, { key: 'title', value: 'Title' }, { key: 'activity', value: 'Activity' }, { key: 'obtained', value: 'All Recovered' } ];

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
      case 'group': {
        query = { userId: req.userId, traded: true };
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
    .then(numberOfItems => {
      totalItems = numberOfItems;
      return Wanted.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(wanteds => {
      const allWanteds = wanteds.map(w => {
        let nw = {};
        nw._id = w._id;
        nw.title = w.title;
        nw.subtitle = w.subtitle;
        nw.offerPrice = w.offerPrice;
        nw.images = w.images;
        return nw;
      });
      res.status(200).json({
        wanteds: allWanteds,
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
