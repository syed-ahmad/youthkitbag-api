const ObjectId = require('mongoose').Types.ObjectId;
const Kit = require('../models/kit');
const Stolen = require('../models/stolen');
const User = require('../models/user');
require('../util/date-helper');

const filterOptions = [
  { key: 'all', value: 'All' },
  { key: 'title', value: 'Title' },
  { key: 'activity', value: 'Activity' },
  { key: 'group', value: 'Group' },
  { key: 'recovered', value: 'All Recovered' }
];

// GET request to return kit item as item for stolen
exports.getAdd = (req, res, next) => {
  const kitId = req.params.kitId;

  let sourceKit;

  Stolen.findOne({ sourceId: new ObjectId(kitId) })
    .then(currentStolen => {
      if (currentStolen && !currentStolen.recovered) {
        const error = new Error(
          'The requested item of kit is already listed as stolen'
        );
        error.statusCode = 500;
        throw error;
      }
      return Kit.findById(kitId);
    })
    .then(kit => {
      if (kit.status !== 'owned' && kit.status !== 'trade') {
        const error = new Error(
          'Item in kitbag does not have status of Owned or Trade, and therefore cannot be listed as stolen'
        );
        error.statusCode = 500;
        throw error;
      }
      sourceKit = kit;
      return User.findById(req.userId);
    })
    .then(user => {
      res.status(200).json({
        title: sourceKit.title,
        subtitle: sourceKit.subtitle,
        description: sourceKit.description,
        location: {},
        images: sourceKit.images,
        activitys: sourceKit.activitys,
        security: sourceKit.security,
        stolenOn: '',
        tracking: '',
        recovered: false,
        sourceId: sourceKit._id,
        userId: req.userId,
        groups: user.groups
          ? user.groups.map(g => {
              g.groupId, g.name, '';
            })
          : [],
        reportDetails: []
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
  const {
    title,
    subtitle,
    description,
    stolenOn,
    location,
    tracking,
    activitys,
    groups,
    security,
    recovered,
    sourceId
  } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return { ...i, state: 'A' };
  });
  let origImages = req.body.origImages;

  const stolen = new Stolen({
    title: title,
    subtitle: subtitle,
    description: description,
    stolenOn: stolenOn,
    tracking: tracking,
    location: location,
    images:
      images && images.length > 0
        ? images
        : origImages
        ? JSON.parse(origImages)
        : [],
    activitys: activitys,
    security: security,
    recovered: recovered,
    sourceId: undefined,
    userId: req.userId
  });

  let newStolen;

  if (sourceId) {
    Stolen.findOne({ sourceId: new ObjectId(sourceId) })
      .then(existingStolen => {
        if (existingStolen) {
          const error = new Error(
            'The requested item of kit is already listed as stolen'
          );
          error.statusCode = 500;
          throw error;
        }
        return Kit.findById(sourceId);
      })
      .then(kit => {
        if (kit.status !== 'owned' && kit.status !== 'trade') {
          const error = new Error(
            'Item in kitbag does not have status of Owned or Trade, and therefore cannot be listed as stolen'
          );
          error.statusCode = 500;
          throw error;
        }
        kit.status = 'stolen';
        return kit.save();
      })
      .then(() => {
        stolen.sourceId = sourceId;
        return stolen.save();
      })
      .then(result => {
        newStolen = result;
        return User.findById(req.userId);
      })
      .then(user => {
        user.package.size.stolen += 1;
        res.status(201).json({
          message: `Stolen item "${newStolen.title}" successfully reported.`,
          stolen: newStolen
        });
        return user.save();
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  } else {
    stolen
      .save()
      .then(result => {
        newStolen = result;
        return User.findById(req.userId);
      })
      .then(user => {
        user.package.size.stolen += 1;
        res.status(201).json({
          message: `Stolen item "${newStolen.title}" successfully reported.`,
          stolen: newStolen
        });
        return user.save();
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

  Stolen.findById(stolenId)
    .then(stolen => {
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
  const stolenId = req.params.stolenId;
  const {
    title,
    subtitle,
    description,
    stolenOn,
    tracking,
    location,
    activitys,
    security,
    groups,
    reportDetails,
    recovered
  } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return { ...i, state: 'A' };
  });

  Stolen.findById(stolenId)
    .then(stolen => {
      stolen.title = title;
      stolen.subtitle = subtitle;
      stolen.description = description;
      stolen.stolenOn = stolenOn;
      stolen.tracking = tracking;
      stolen.location = location;
      stolen.images = images;
      stolen.activitys = activitys;
      stolen.security = security;
      stolen.groups = groups;
      stolen.reportDetails = reportDetails;
      stolen.recovered = recovered;
      return stolen.save();
    })
    .then(result => {
      res.status(201).json({
        message: `Stolen item "${result.title}" successfully updated.`,
        stolen: result
      });
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

  let query = { userId: req.userId, recovered: by === 'recovered' };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = {
          userId: req.userId,
          recovered: false,
          title: { $regex: `.*${search}.*`, $options: 'i' }
        };
        break;
      }
      case 'activity': {
        query = { userId: req.userId, recovered: false, activitys: search };
        break;
      }
      case 'group': {
        query = { userId: req.userId, recovered: false };
        break;
      }
      case 'recovered': {
        query = { userId: req.userId, recovered: true };
        break;
      }
      default: {
        query = {
          $and: [
            { userId: req.userId },
            { recovered: false },
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

// POST request to delete stolen item from kitbag
exports.delete = (req, res, next) => {
  const stolenId = req.params.stolenId;

  let sourceId;

  Stolen.findById(stolenId)
    .then(stolen => {
      if (trade.recovered) {
        const error = new Error(
          'You have already recovered this item, so it cannot be deleted'
        );
        error.statusCode = 403;
        throw error;
      }
      sourceId = stolen.sourceId;
      return stolen.delete();
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.package.size.stolen -= 1;
      if (user.package.size.stolen < 0) {
        user.package.size.stolen = 0;
      }
      return user.save();
    })
    .then(kit => {
      if (sourceId) {
        Kit.findById(sourceId).then(kit => {
          if (!kit) {
            const error = new Error(
              'The requested item of kit could not be found'
            );
            error.statusCode = 404;
            throw error;
          }
          if (kit.userId.toString() !== req.userId.toString()) {
            const error = new Error(
              'You are not authorized to take any action on this item of related kit'
            );
            error.statusCode = 403;
            throw error;
          }
          kit.status = 'owned';
          return kit.save();
        });
      }
      return;
    })
    .then(() => {
      res.status(200).json({ message: 'Stolen item deleted' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
