const Stolen = require('../models/stolen');

const filterOptions = [
  { key: 'all', value: 'All' },
  { key: 'title', value: 'Title' },
  { key: 'activity', value: 'Activity' },
  { key: 'recovered', value: 'Recovered' }
];

// GET request a stolen item
exports.getItem = (req, res, next) => {
  const stolenId = req.params.stolenId;

  Stolen.findById(stolenId)
    .then(stolen => {
      if (!stolen) {
        const error = new Error('The requested stolen item count not be found');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        _id: stolen._id,
        title: stolen.title,
        subtitle: stolen.subtitle,
        description: stolen.description,
        stolenOn: stolen.stolenOn,
        images: stolen.images,
        activitys: stolen.activitys,
        security: stolen.security
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

  const groupArray = req.inGroups.map(g => g._id);

  let query = {
    recovered: by === 'recovered',
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

  Stolen.find(query)
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
