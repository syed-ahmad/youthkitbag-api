const ObjectId = require('mongoose').Types.ObjectId; 
const Kit = require('../models/kit');
const Wanted = require('../models/wanted');
const User = require('../models/user');
const { validationResult} = require('express-validator/check');

// GET request to return kit item as item for wanted
exports.getAdd = (req, res, next) => {
  const kitId = req.params.kitId;

  Wanted.findOne({ sourceId: new ObjectId(kitId) })
    .then(currentWanted => {
      if (currentWanted) {
        const error = new Error('The requested item of kit is already listed wanted');
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
        const error = new Error('You are not authorized to set this item of kit to wanted');
        error.statusCode = 403;
        throw error;
      }
      if (req.user.package.max.wanted <= req.user.package.size.wanted) {
        const error = new Error('You have already reached the limits of your wanted package. Please upgrade to want more items.');
        error.statusCode = 500;
        throw error;
      }
      res.status(200).json({
        wanted: {
          title: kit.title,
          subtitle: kit.subtitle,
          description: kit.description,
          condition: kit.inbag.length > 0 ? kit.inbag[0].condition : 'used',
          offerPrice: 0.00,
          images: kit.images,
          activitys: kit.activitys,
          obtained: false,
          sourceId: kit._id,
          userId: req.userId
        },
        origImages: JSON.stringify(kit.images),
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
  const condition = req.body.condition;
  const offerPrice = +req.body.offerPrice;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.split(',').map(s => s.trim().toLowerCase());
  }

  const obtained = req.body.obtained;
  const sourceId = req.body.sourceId;

  let images = req.files;
  if (images && images.length > 0) {
    images = images.map(i => { 
      const image = {};
      image.image = i.key; 
      image.imageUrl = i.location;
      return image;
    });
  }
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
        offerPrice: offerPrice,
        condition: coindition,
        activitys: activitys,
        obtained: obtained,
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
    condition: condition,
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

  Wanted.findOne({ sourceId: new ObjectId(sourceId) })
    .then(currentWanted => {
      if (currentWanted) {
        const error = new Error('The requested item of kit is already listed wanted');
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
        const error = new Error('You are not authorized to want this item of kit');
        error.statusCode = 403;
        throw error;
      }
      if (req.user.package.max.wanted <= req.user.package.size.wanted) {
        const error = new Error('You have already reached the limits of your wanted package. Please upgrade to want more items.');
        error.statusCode = 500;
        throw error;
      }
      kit.status = 1;
      return kit.save();
    })
    .then(() => {
      return wanted.save();
    })
    .then(result => {
      newWanted = result;
      return User.findById(req.userId);
    })
    .then(user => { 
      user.package.size.wanted += 1;
      return user.save();
    })
    .then(user => {
      req.session.user = user;
      return req.session.save(err => {
        console.log(err);
      });
    })
    .then(err => {
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

  Wanted.findById(wantedId)
    .then(wanted => {
      if (!wanted) {
        const error = new Error('Wanted item not found');
        error.statusCode = 404;
        throw error;
      }
      if (wanted.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit the wanted item');
        error.statusCode = 403;
        throw error;
      }
      res.status(200).json({
        wanted: wanted,
        origImages: JSON.stringify(forsale.images),
        errors: [],
        editing: true
      });
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
  const wantedId = req.body.wantedId;
  const sourceId = req.body.sourceId;
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const description = req.body.description;
  const condition = req.body.condition;
  const offerPrice = +req.body.offerPrice;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.split(',').map(s => s.trim().toLowerCase());
  }

  const obtained = req.body.obtained;

  let images = req.files;
  if (images && images.length > 0) {
    images = images.map(i => { 
      const image = {};
      image.image = i.key; 
      image.imageUrl = i.location;
      return image;
    });
  }
  
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
        offerPrice: offerPrice,
        condition: condition,
        activitys: activitys,
        obtained: obtained,
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
        const error = new Error('You are not authorized to edit the kit wanted');
        error.statusCode = 403;
        throw error;
      }
      wanted.title = title;
      wanted.subtitle = subtitle;
      wanted.description = description;
      wanted.offerPrice = offerPrice;
      wanted.condition = condition;
      wanted.activitys = activitys;
      wanted.obtained = obtained;
      if (images.length > 0) {
        wanted.images.forEach((img, i) => {
          //TODO: 
          //fileHelper.checkSourceAndDeleteImage(img.image);
        });
        wanted.images = images;
      }
      return wanted.save();
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

  let query = { userId: req.userId, obtained: (by !== 'obtained') };

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
        const error = new Error('You are not authorized to delete this wanted item');
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
      kit.status = 0;
      return kit.save();
    })
    .then(result => {
      if (wantedItem.images) {
        wantedItem.images.forEach((img, i) => {
          //TODO: 
          //fileHelper.checkSourceAndDeleteImage(img.image);
        });
      }
      return Wanted.deleteOne({ _id: wantedId, userId: req.userId });
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => { 
      user.package.size.wanted -= 1;
      if (user.package.size.wanted < 0) {
        user.package.size.wanted = 0;
      }
      return user.save();
    })
    .then(user => {
      req.session.user = user;
      return req.session.save(err => {
        console.log(err);
      });
    })
    .then(err => {
      res.status(200).json({ message: 'Wanted item deleted'});
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
