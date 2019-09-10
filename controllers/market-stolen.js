const Stolen = require('../models/stolen');

const filterOptions = [ { key: 'all', value: 'All' }, { key: 'title', value: 'Title' }, { key: 'activity', value: 'Activity' }, { key: 'group', value: 'Group' }, { key: 'recovered', value: 'All Recovered' } ];

// GET request a stolen item
exports.getItem = (req, res, next) => {
  const stolenId = req.params.stolenid;

  Stolen
    .findById(stolenId)
    .then(stolen => {
      if (!stolen) {
        const error = new Error('The requested stolen item of kit could not be recovered');
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

  let query = { recovered: (by === 'recovered') };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { recovered: false, title: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { recovered: false, activitys: search };
        break;
      }
      case 'group': {
        query = { userId: req.userId, recovered: true };
        break;
      }
      case 'recovered': {
        query = { recovered: true };
        break;
      }
      default: {
        query = { $and: [ { recovered: false }, { $or: [{ title: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

  Stolen
    .find(query)
    .countDocuments()
    .then(numberOfItems => {
      totalItems = numberOfItems;
      return Stolen.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(stolens => {
      const allStolens = stolens.map(s => {
        let ns = {};
        ns._id = s._id;
        ns.title = s.title;
        ns.subtitle = s.subtitle;
        ns.offerPrice = s.offerPrice;
        ns.images = s.images;
        return ns;
      });
      res.status(200).json({
        stolens: allStolens,
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
