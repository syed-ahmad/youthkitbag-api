const ObjectId = require('mongoose').Types.ObjectId; 
const Kit = require('../models/kit');
const Stolen = require('../models/stolen');
const User = require('../models/user');
const { validationResult} = require('express-validator/check');

const filterOptions = [ { key: 'all', value: 'All' }, { key: 'title', value: 'Title' }, { key: 'activity', value: 'Activity' }, { key: 'recovered', value: 'All Recovered' } ];

// GET request to return kit item as item for stolen
exports.getAdd = (req, res, next) => {
  const kitId = req.params.kitId;

  let sourceKit;

  Stolen.findOne({ sourceId: new ObjectId(kitId) })
    .then(currentStolen => {
      if (currentStolen) {
        const error = new Error('The requested item of kit is already listed as stolen');
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
        const error = new Error('You are not authorized to report this item of kit as stolen');
        error.statusCode = 403;
        throw error;
      }
      if (kit.status !== 'owned' || kit.status !== 'trade') {
        const error = new Error('Item in kitbag does not have status of Owned or Trade, and therefore cannot be listed as stolen');
        error.statusCode = 500;
        throw error;
      }
      sourcesKit = kit;
      return User.findById(req.userId);
    })
    .then (user => {
      if (user.package.max.stolen <= user.package.size.stolen) {
        const error = new Error('You have already reached the limits of your trade package. Please upgrade to trade more items.');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        title: sourceKit.title,
        subtitle: sourceKit.subtitle,
        description: sourceKit.description, 
        images: sourceKit.images,
        activitys: sourceKit.activitys,
        security: sourceKit.security,
        recovered: false,
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

// POST request to add a new item into stolen
exports.add = (req, res, next) => {
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const description = req.body.description;
  const stolenOn = req.body.stolenOn;
  const location = req.body.location;
  const tracking = req.body.tracking;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return {...i, state: 'A'}
  });
  let origImages = req.body.origImages;
 
  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  let security = req.body.security;
  if (security) {
    security = security.map(s => s.trim());
  }

  const recovered = req.body.recovered;
  const sourceId = req.body.sourceId;

  // const validation = validationResult(req);
  // let errors = [];
  // if (!validation.isEmpty()) {
  //   errors = validation.array();
  // }
  // if (errors.length) {
  //   return res.status(422).json({
  //     stolen: {
  //       title: title,
  //       subtitle: subtitle,
  //       description: description,
  //       activitys: activitys,
  //       sourceId: sourceId,
  //       userId: req.userId
  //     },
  //     errors: errors,
  //     editing: false
  //   });
  // }

  const stolen = new Stolen({
    title: title,
    subtitle: subtitle,
    description: description,
    stolenOn: stolenOn,
    location: location,
    tracking: tracking,
    activitys: activitys,
    security: security,
    recovered: recovered,
    sourceId: sourceId,
    userId: req.userId
  });

  if (images.length > 0) {
    stolen.images = images;
  } else {
    //TODO: Can we make copies of images on s3 to remove dependency
    stolen.images = JSON.parse(origImages);
  }

  let newStolen;
  let sourceUser;

  if (sourceId) {
  User.findById(req.userId)
    .then (user => {
      sourceUser = user;
      return Stolen.findOne({ sourceId: new ObjectId(sourceId) });
    }) 
    .then(existingStolen => {
      if (existingStolen) {
        const error = new Error('The requested item of kit is already listed as stolen');
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
        const error = new Error('You are not authorized to report this item of kit as stolen');
        error.statusCode = 403;
        throw error;
      }
      if (kit.status !== 'owned' || kit.status !== 'trade') {
        const error = new Error('Item in kitbag does not have status of Owned or Trade, and therefore cannot be listed as stolen');
        error.statusCode = 500;
        throw error;
      }
      if (sourceUser.package.max.stolen <= sourceUser.package.size.stolen) {
        const error = new Error('You have already reached the limits of reporting stolen items in your trade package. However, we understand at this stressful time you may need more, so please contact us.');
        error.statusCode = 500;
        throw error;
      }
      kit.status = 'stolen';
      return kit.save();
    })
    .then(() => {
      return stolen.save();
    })
    .then(result => {
      newStolen = result;
      sourceUser.package.size.trade += 1;
      return sourceUser.save();
    })
    .then(err => {
      res.status(201).json({ stolen: newStolen });
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
        if (sourceUser.package.max.stolen <= sourceUser.package.size.stolen) {
          const error = new Error('You have already reached the limits of your stolen package. Please upgrade to trade more items.');
          error.statusCode = 500;
          throw error;
        }
        stolen.sourceId = undefined;
        return stolen.save();
      })
      .then(result => {
        newStolen = result;
        sourceUser.package.size.stolen += 1;
        return sourceUser.save();
      })
      .then(() => {
        res.status(201).json({ stolen: newStolen });
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  }
};

// GET request to get an already existing stolen item
exports.getItem = (req, res, next) => {
  const stolenId = req.params.stolenId;

  Stolen
    .findById(stolenId)
    .then(stolen => {
      if (!stolen) {
        const error = new Error('Stolen item not found');
        error.statusCode = 404;
        throw error;
      }
      if (stolen.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit the item listed as stolen');
        error.statusCode = 403;
        throw error;
      }
      res.status(200).json(stolen);
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
  const stolenId = req.body._id;
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const description = req.body.description;
  const stolenOn = req.body.stolenOn;
  const location = req.body.location;
  const tracking = req.body.tracking;
  const recovered = req.body.recovered;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  let security = req.body.security;
  if (security) {
    security = security.map(s => s.trim());
  }

  let reports = req.body.reports;
  if (reports) {
    reports = reports
      .map(i => {
        let item = {...i};
        item.fromUserId = req.userId;
        return item;
      });
  }
  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return {...i, state: 'A'}
  });
  
  const validation = validationResult(req);
  let errors = [];
  if (!validation.isEmpty()) {
    errors = validation.array();
  }
  if (errors.length) {
    return res.status(422).json({
      stolen: {
        _id: stolenId,
        title: title,
        subtitle: subtitle,
        description: description,
        activitys: activitys,
        sourceId: sourceId,
        userId: req.userId
      },
      errors: errors,
      editing: true
    });
  }

  Stolen.findById(stolenId)
    .then(stolen => {
      if (!stolen) {
        const error = new Error('Stolen item not found');
        error.statusCode = 404;
        throw error;
      }
      if (stolen.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit the kit reported as stolend');
        error.statusCode = 403;
        throw error;
      }
      stolen.title = title;
      stolen.subtitle = subtitle;
      stolen.description = description;
      stolen.stolenOn = stolenOn;
      stolen.location = location;
      stolen.tracking = tracking;
      stolen.reports = reports;
      stolen.activitys = activitys;
      stolen.security = security;
      stolen.recovered = recovered;
      if (images.length > 0) {
        stolen.images = images;
      }
      return stolen.save()
    })
    .then(result => {
      res.status(200).json({ stolen: result });
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

  let query = { userId: req.userId, recovered: (by === 'recovered') };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { userId: req.userId, recovered: false, title: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { userId: req.userId, recovered: false, activitys: search };
        break;
      }
      case 'recovered': {
        query = { userId: req.userId, recovered: true };
        break;
      }
      default: {
        query = { $and: [ { userId: req.userId }, { recovered: false }, { $or: [{ title: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
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
      res.status(200).json({
        stolens: stolens,
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

// POST request to delete stolen item from kitbag
exports.delete = (req, res, next) => {
  const stolenId = req.body.stolenId;
  const confirm = req.body.confirm;

  let stolenItem = {};

  Stolen.findById(stolenId)
    .then(stolen => {
      if (!stolen) {
        const error = new Error('The requested stolen item could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (stolen.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to delete this item');
        error.statusCode = 403;
        throw error;
      }
      if (confirm !== 'delete') {
        const error = new Error('You did not confirm the delete');
        error.statusCode = 400;
        throw error;
      }
      stolenItem = stolen;
      return Kit.findById(stolen.sourceId);
    })
    .then(kit => {
      if (!kit) {
        const error = new Error('The requested item of kit could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (kit.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to take any action on this item of related kit');
        error.statusCode = 403;
        throw error;
      }
      kit.status = 0;
      return kit.save();
    })
    .then(result => {
      return Stolen.deleteOne({ _id: stolenId, userId: req.userId });
    })
    .then(result => {
      res.status(200).json({ message: 'Stolen item deleted' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
