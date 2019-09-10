const ObjectId = require('mongoose').Types.ObjectId; 
const Kit = require('../models/kit');
const Wanted = require('../models/wanted');
const User = require('../models/user');

const filterOptions = [ { key: 'all', value: 'All' }, { key: 'title', value: 'Title' }, { key: 'activity', value: 'Activity' }, { key: 'group', value: 'Group' }, { key: 'obtained', value: 'All Recovered' } ];

// GET request to return kit item as item for wanted
exports.getAdd = (req, res, next) => {
  const kitId = req.params.kitId;

  let sourceKit;

  Wanted.findOne({ sourceId: new ObjectId(kitId) })
    .then(currentWanted => {
      if (currentWanted && !currentWanted.obtained) {
        const error = new Error('The requested item of kit is already actively listed as wanted');
        error.statusCode = 500;
        throw error;
      }
      return Kit.findById(kitId);
    })
    .then(kit => {
      if (!kit) {
        const error = new Error('The requested item of kit could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (kit.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to use this item of kit as wanted');
        error.statusCode = 403;
        throw error;
      }
      sourceKit = kit;
      return User.findById(req.userId);
    })
    .then (user => { 
      if (user.package.max.wanted <= user.package.size.wanted) {
        const error = new Error('You have already reached the limits of your wanted package. Please upgrade to want more items.');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        title: sourceKit.title,
        subtitle: sourceKit.subtitle,
        description: sourceKit.description,
        offerPrice: 0.00,
        location: {}, 
        images: sourceKit.images,
        activitys: sourceKit.activitys,
        groups: user.groups ? user.groups.map(g => { g.groupId, g.name, '2019-01-01'}) : [],
        offerDetails: [],
        obtained: false,
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

// POST request to add a new item into wanted
exports.add = (req, res, next) => {
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const description = req.body.description;
  const offerPrice = +req.body.offerPrice;
  const location = req.body.location;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  let groups = req.body.groups;

  const obtained = req.body.obtained;
  const sourceId = req.body.sourceId;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return {...i, state: 'A'}
  });
  let origImages = req.body.origImages;

  const wanted = new Wanted({
    title: title,
    subtitle: subtitle,
    description: description,
    offerPrice: offerPrice,
    location: location,
    images: images && images.length > 0 ? images : origImages ? JSON.parse(origImages) : [],
    activitys: activitys,
    groups: groups,
    offerDetails: [],
    obtained: obtained,
    sourceId: sourceId,
    userId: req.userId
  });

  let newWanted;
  let sourceUser;

  if (sourceId) {
    User.findById(req.userId)
      .then (user => {
        sourceUser = user;
        return Wanted.findOne({ sourceId: new ObjectId(sourceId) });
      }) 
      .then(currentWanted => {
        if (currentWanted && !currentWanted.obtained) {
          const error = new Error('The requested item of kit is already actively listed as wanted');
          error.statusCode = 500;
          throw error;
        }
        return Kit.findById(sourceId);
      })
      .then(kit => {
        if (!kit) {
          const error = new Error('The requested item of kit could not be found');
          error.statusCode = 404;
          throw error;
        }
        if (kit.userId.toString() !== req.userId.toString()) {
          const error = new Error('You are not authorized to report this item of kit as wanted');
          error.statusCode = 403;
          throw error;
        }
        if (sourceUser.package.max.wanted <= sourceUser.package.size.wanted) {
          const error = new Error('You have already reached the limits of your wanted package. Please upgrade to want more items.');
          error.statusCode = 500;
          throw error;
        }
        return wanted.save();
      })
      .then(result => {
        newWanted = result;
        res.status(201).json({ wanted: newWanted });
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });    
  } else {
    User.findById(req.userId)
      .then (user => {
        sourceUser = user;
        if (sourceUser.package.max.wanted <= sourceUser.package.size.wanted) {
          const error = new Error('You have already reached the limits of your wanted package. Please upgrade to want more items.');
          error.statusCode = 500;
          throw error;
        }
        wanted.sourceId = undefined;
        return wanted.save();
      })
      .then(result => {
        newWanted = result;
        sourceUser.package.size.wanted += 1;
        return sourceUser.save();
      })
      .then(() => {
        res.status(201).json({ wanted: newWanted });
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  }
};

// GET request to get an already existing wanted item
exports.getItem = (req, res, next) => {
  const wantedId = req.params.wantedId;

  Wanted
    .findById(wantedId)
    .then(wanted => {
      if (!wanted) {
        const error = new Error('The requested wanted item could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (wanted.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit this wanted item');
        error.statusCode = 403;
        throw error;
      }
      res.status(200).json(wanted);
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
  const wantedId = req.body._id;
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const description = req.body.description;
  const offerPrice = +req.body.offerPrice;
  const location = req.body.location;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  let groups = req.body.groups;

  let offerDetails = req.body.offerDetails;

  const obtained = req.body.obtained;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return {...i, state: 'A'}
  });

  Wanted.findById(wantedId)
    .then(wanted => {
      if (!wanted) {
        const error = new Error('Wanted item not found');
        error.statusCode = 404;
        throw error;
      }
      if (wanted.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit the kit reported as wantedd');
        error.statusCode = 403;
        throw error;
      }
      wanted.title = title;
      wanted.subtitle = subtitle;
      wanted.description = description;
      wanted.offerPrice = offerPrice;
      wanted.location = location;
      wanted.images = images;
      wanted.activitys = activitys;
      wanted.groups = groups;
      wanted.offerDetails = offerDetails;
      wanted.obtained = obtained;
      return wanted.save()
    })
    .then(result => {
      res.status(200).json({ wanted: result });
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

  let query = { userId: req.userId, obtained: (by === 'obtained') };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { userId: req.userId, obtained: false, title: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { userId: req.userId, obtained: false, activitys: search };
        break;
      }
      case 'group': {
        query = { userId: req.userId, obtained: true };
        break;
      }
      case 'obtained': {
        query = { userId: req.userId, obtained: true };
        break;
      }
      default: {
        query = { $and: [ { userId: req.userId }, { obtained: false }, { $or: [{ title: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
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
      res.status(200).json({
        wanteds: wanteds,
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

// POST request to delete wanted item from kitbag
exports.delete = (req, res, next) => {
  const wantedId = req.params.wantedId;

  Wanted.findById(wantedId)
    .then(wanted => {
      if (!wanted) {
        const error = new Error('The requested wanted item could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (wanted.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to delete this wanted item');
        error.statusCode = 403;
        throw error;
      }
      return wanted.delete();
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.package.size.wanted -= 1;
      if (user.package.size.wanted < 0) {
        user.package.size.wanted = 0;
      }
      return user.save();
    })
    .then(() => {
      res.status(200).json({ message: 'Wanted item deleted' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
