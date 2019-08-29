const ObjectId = require('mongoose').Types.ObjectId; 
const Kit = require('../models/kit');
const Wanted = require('../models/wanted');
const User = require('../models/user');
const { validationResult } = require('express-validator/check');

const filterOptions = [ { key: 'all', value: 'All' }, { key: 'title', value: 'Title' }, { key: 'activity', value: 'Activity' }, { key: 'obtained', value: 'All Recovered' } ];

// GET request to return kit item as item for wanted
exports.getAdd = (req, res, next) => {
  const kitId = req.params.kitId;
  let thisKit;

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
        const error = new Error('You are not authorized to report this item of kit as wanted');
        error.statusCode = 403;
        throw error;
      }
      thisKit = kit;
      return User.findById(req.userId);
    })
    .then (user => { 
      if (!user) {
        const error = new Error('User not identified.');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        wanted: {
          title: thisKit.title,
          subtitle: thisKit.subtitle,
          description: thisKit.description,
          images: thisKit.images,
          activitys: thisKit.activitys,
          obtained: false,
          sourceId: thisKit._id,
          userId: req.userId
        },
        origImages: JSON.stringify(thisKit.images),
        errors: [],
        editing: false
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
  const location = req.body.location;
  const offerPrice = +req.body.offerPrice;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  const obtained = req.body.obtained;
  const sourceId = req.body.sourceId;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return {...i, state: 'A'}
  });
  let origImages = req.body.origImages;
 
  const validation = validationResult(req);
  let errors = [];
  if (!validation.isEmpty()) {
    errors = validation.array();
  }
  if (errors.length) {
    return res.status(422).json({
      wanted: {
        title: title,
        subtitle: subtitle,
        description: description,
        activitys: activitys,
        sourceId: sourceId,
        userId: req.userId
      },
      errors: errors,
      editing: false
    });
  }

  const wanted = new Wanted({
    title: title,
    subtitle: subtitle,
    description: description,
    location: location,
    offerPrice: offerPrice,
    activitys: activitys,
    obtained: obtained,
    sourceId: sourceId,
    userId: req.userId
  });


  if (images.length > 0) {
    wanted.images = images;
  } else {
    //TODO: Can we make copies of images on s3 to remove dependency
    wanted.images = JSON.parse(origImages);
  }

  let newWanted;
  let thisUser;

  User.findById(req.userId)
    .then (user => {
      thisUser = user;
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
};

// GET request to get an already existing wanted item
exports.getItem = (req, res, next) => {
  const wantedId = req.params.wantedId;

  Wanted
    .findById(wantedId)
    .then(wanted => {
      if (!wanted) {
        const error = new Error('Wanted item not found');
        error.statusCode = 404;
        throw error;
      }
      if (wanted.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit the item listed as wanted');
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
  const location = req.body.location;
  const offerPrice = +req.body.offerPrice;
  const obtained = req.body.obtained;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  let offers = req.body.offers;
  if (offers) {
    offers = offers
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
      wanted: {
        _id: wantedId,
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
      wanted.location = location;
      wanted.offerPrice = offerPrice;
      wanted.offers = offers;
      wanted.activitys = activitys;
      wanted.obtained = obtained;
      if (images.length > 0) {
        wanted.images = images;
      }
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

  console.log(query);
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
  const wantedId = req.body.wantedId;
  const confirm = req.body.confirm;

  let wantedItem = {};

  Wanted.findById(wantedId)
    .then(wanted => {
      if (!wanted) {
        const error = new Error('The requested wanted item could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (wanted.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to delete this item');
        error.statusCode = 403;
        throw error;
      }
      if (confirm !== 'delete') {
        const error = new Error('You did not confirm the delete');
        error.statusCode = 400;
        throw error;
      }
      wantedItem = wanted;
      return Kit.findById(wanted.sourceId);
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
      return Wanted.deleteOne({ _id: wantedId, userId: req.userId });
    })
    .then(result => {
      res.status(200).json({ message: 'Wanted item deleted' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
