const ObjectId = require('mongoose').Types.ObjectId; 
const Kit = require('../models/kit');
const Photo = require('../models/photo');
const User = require('../models/user');
const { validationResult} = require('express-validator/check');
const awsHelper = require('../util/aws-helper');

const filterOptions = [ { key: 'all', value: 'All' }, { key: 'title', value: 'Title' }, { key: 'activity', value: 'Activity' }, { key: 'tag', value: 'Tag' }, { key: 'container', value: 'Container' }, { key: 'inactive', value: 'All Inactive' } ];

// POST request to add a new item into kitbag
exports.add = (req, res, next) => {
  console.log('req.body', req.body);

  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const description = req.body.description;
  const status = req.body.status;

  let security = req.body.security;
  if (security) {
    security = security.map(s => s.trim());
  }

  let purchases = req.body.purchases;
  if (purchases) {
    purchases = purchases
      .filter(i => i.from)
      .map(i => {
        let item = {...i};
        item.price = +i.price;
        item.quantity = +i.quantity;
        return item;
      });
  };

  let inbag = req.body.inbag;
  if (inbag) {
    inbag = inbag
      .filter(i => i.location)
      .map(i => {
        let item = {...i};
        item.quantity = +i.quantity;
        return item;
      });
  }

  const warning = +req.body.warning || 0;
  
  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  let tags = req.body.tags;
  if (tags) {
    tags = tags.map(s => s.trim().toLowerCase());
  }

  const active = req.body.active;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return {...i, state: 'A'}
  });

  const imagesToDelete = req.body.images.filter(i => i.state === 'D');

    // const validation = validationResult(req);
  // let errors = [];
  // if (!validation.isEmpty()) {
  //   errors = validation.array();
  // }
  // if (errors.length) {
  //   return res.status(422).json({
  //     kit: {
  //       title: title,
  //       subtitle: subtitle,
  //       description: description,
  //       status: status,
  //       security: security,
  //       purchases: purchases,
  //       inbag: inbag,
  //       warning: warning,
  //       activitys: activitys,
  //       tags: tags,
  //       active: active
  //     },
  //     errors: errors,
  //     editing: false
  //   });
  // }

  const kit = new Kit({
    title: title,
    subtitle: subtitle,
    description: description,
    status: status,
    security: security,
    purchases: purchases,
    inbag: inbag,
    warning: warning,
    images: images,
    activitys: activitys,
    tags: tags,
    active: active,
    userId: req.userId
  });
  
  let newKit;
  // const imageIds = images.map(i => i.photoId );
  // console.log(imageIds);

  imagesToDelete.forEach(i => {
    awsHelper.deleteImage(i.image);
  });

  kit
    .save()
    .then(result => {
      newKit = result;
      // Photo
      //   .find({ _id: { $in: imageIds}})
      //   .updateMany({ sourceId: result._id, sourceType: 'kit' });
      User
        .findById(req.userId)
        .then (user => { 
          user.package.size.kit += 1;
          return user.save();
        })
        .then(() => {
          res.status(201).json({ kit: newKit });
        });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request to get an already existing item from kitbag
exports.getItem = (req, res, next) => {
  const kitId = req.params.kitId;

  Kit
    .findById(kitId)
    .then(kit => {
      if (!kit) {
        const error = new Error('Kit not found');
        error.statusCode = 404;
        throw error;
      }
      if (kit.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit this item of kit');
        error.statusCode = 403;
        throw error;
      }
      res.status(200).json(kit);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// PUT request to save edited changes to existing item in kitbag
exports.edit = (req, res, next) => {
  console.log('req.body', req.body);
  console.log('req.params', req.params);

  const kitId = req.params.kitId;
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const description = req.body.description;
  const status = req.body.status;
  
  let security = req.body.security;
  if (security) {
    security = security.map(s => s.trim());
  }

  let purchases = req.body.purchases;
  if (purchases) {
    purchases = purchases
      .filter(i => i.from)
      .map(i => {
        let item = {...i};
        item.price = +i.price;
        item.quantity = +i.quantity;
        return item;
      });
  };

  let inbag = req.body.inbag;
  if (inbag) {
    inbag = inbag
      .filter(i => i.location)
      .map(i => {
        let item = {...i};
        item.quantity = +i.quantity;
        return item;
      });
  }

  const warning = +req.body.warning || 0;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  let tags = req.body.tags;
  if (tags) {
    tags = tags.map(s => s.trim().toLowerCase());
  }

  const active = req.body.active;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return {...i, state: 'A'}
  });

  const imagesToDelete = req.body.images.filter(i => i.state === 'D');

  const validation = validationResult(req);
  let errors = [];
  if (!validation.isEmpty()) {
    errors = validation.array();
  }
  if (errors.length) {
    return res.status(422).json({
      kit: {
        _id: kitId,
        title: title,
        subtitle: subtitle,
        description: description,
        status: status,
        security: security,
        purchases: purchases,
        inbag: inbag,
        warning: warning,
        activitys: activitys,
        tags: tags,
        active: active
      },
      errors: errors,
      editing: true
    });
  }

  imagesToDelete.forEach(i => {
    awsHelper.deleteImage(i.image);
  });

  Kit.findById(kitId)
    .then(kit => {
      if (!kit) {
        const error = new Error('Kit not found');
        error.statusCode = 404;
        throw error;
      }
      if (kit.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit this item of kit');
        error.statusCode = 403;
        throw error;
      }
      kit.title = title;
      kit.subtitle = subtitle;
      kit.description = description;
      kit.status = status,
      kit.security = security,
      kit.inbag = inbag;
      kit.warning = warning;
      kit.purchases = purchases;
      kit.purchased = undefined;
      kit.images = images;
      kit.activitys = activitys;
      kit.tags = tags;
      kit.active = active;
      return kit.save();
    })
    .then(result => {
      // Photo
      //   .find({ _id: { $in: imageIds}})
      //   .updateMany({ sourceId: result._id, sourceType: 'kit' });
      res.status(200).json({ kit: result });
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

  let query = { userId: req.userId, active: (by !== 'inactive') };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = { userId: req.userId, active: true, title: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { userId: req.userId, active: true, activitys: search };
        break;
      }
      case 'tag': {
        query = { userId: req.userId, active: true, tags: search };
        break;
      }
      case 'container': {
        query = { userId: req.userId, active: true, inbag: { $elemMatch: { location: { $regex : `.*${search}.*`, $options: 'i' }, quantity: { $gt: 0 } } } };
        break;
      }
      case 'inactive': {
        query = { userId: req.userId, active: false };
        break;
      }
      default: {
        query = { $and: [ { userId: req.userId }, { active: true }, { $or: [{ title: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search },{ tags: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

  Kit
    .find(query)
    .countDocuments()
    .then(numberOfItems => {
      totalItems = numberOfItems;
      return Kit.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(kits => {
      if (by === 'container') {
        var newKits = [];
        kits.forEach(function (k) {
          newKits.push({ _id: k._id, title: k.title, subtitle: k.subtitle, images: k.images, inbag: k.inbag.filter(function(i) {
            return i.location.toLowerCase() === search.toLowerCase();
          })});
        });
        kits = newKits;
        console.log(newKits);
      }
      res.status(200).json({
        kits: kits,
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

// POST request to delete item from kitbag
exports.delete = (req, res, next) => {
  const kitId = req.params.kitId;
  
  Kit.findById(kitId)
    .then(kit => {
      if (!kit) {
        const error = new Error('Kit not found');
        error.statusCode = 404;
        throw error;
      }
      if (kit.userId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to delete this item of kit');
        error.statusCode = 403;
        throw error;
      }
      if (kit.images) {
        kit.images.forEach((img, i) => {
          awsHelper.deleteImage(img.image);
        });
      }
      return Kit.deleteOne({ _id: kitId, userId: req.userId });
    })
    .then(() => {
      User
      .findById(req.userId)
      .then (user => { 
        user.package.size.kit -= 1;
        return user.save();
      })
      .then(() => {
        res.status(200).json({ message: 'Kit item deleted'});
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
exports.getContainers = (req, res, next) => {

  let query = { userId: req.userId, active: true, tags: 'container' };
  let orderby = { title: 1 };

  Kit
    .find(query).sort(orderby)
    .then(kits => {
      res.status(200).json({
        containers: kits.map(k => k.title)
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

