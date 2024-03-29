const Kit = require('../models/kit');
const User = require('../models/user');
const awsHelper = require('../util/aws-helper');

const filterOptions = [
  { key: 'all', value: 'All' },
  { key: 'title', value: 'Title' },
  { key: 'activity', value: 'Activity' },
  { key: 'tag', value: 'Tag' },
  { key: 'container', value: 'Container' },
  { key: 'inactive', value: 'Inactive' }
];

// POST request to add a new item into kitbag
exports.add = (req, res, next) => {
  const {
    title,
    subtitle,
    description,
    status,
    security,
    purchases,
    inbag,
    warning,
    activitys,
    tags,
    active
  } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return { ...i, state: 'A' };
  });
  const imagesToDelete = req.body.images.filter(i => i.state === 'D');

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

  imagesToDelete.forEach(i => {
    awsHelper.deleteImage(i.image);
  });

  kit
    .save()
    .then(result => {
      newKit = result;
      return User.findById(req.userId);
    })
    .then(user => {
      user.package.size.kit += 1;
      res.status(201).json({
        message: `Item of kit "${newKit.title}" successfully created.`,
        kit: newKit
      });
      return user.save();
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

  Kit.findById(kitId)
    .then(kit => {
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
  const kitId = req.params.kitId;
  const {
    title,
    subtitle,
    description,
    status,
    security,
    purchases,
    inbag,
    warning,
    activitys,
    tags,
    active
  } = req.body;

  const activeImages = req.body.images.filter(i => i.state !== 'D');
  const images = activeImages.map(i => {
    return { ...i, state: 'A' };
  });

  const imagesToDelete = req.body.images.filter(i => i.state === 'D');

  imagesToDelete.forEach(i => {
    awsHelper.deleteImage(i.image);
  });

  Kit.findById(kitId)
    .then(kit => {
      kit.title = title;
      kit.subtitle = subtitle;
      kit.description = description;
      (kit.status = status), (kit.security = security), (kit.inbag = inbag);
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
      res.status(201).json({
        message: `Item of kit "${result.title}" successfully updated.`,
        kit: result
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

  let query = { userId: req.userId, active: by !== 'inactive' };

  if (search) {
    search = search.toLowerCase();
    switch (by) {
      case 'title': {
        query = {
          userId: req.userId,
          active: true,
          title: { $regex: `.*${search}.*`, $options: 'i' }
        };
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
        query = {
          userId: req.userId,
          active: true,
          inbag: {
            $elemMatch: {
              location: { $regex: `.*${search}.*`, $options: 'i' },
              quantity: { $gt: 0 }
            }
          }
        };
        break;
      }
      case 'inactive': {
        query = { userId: req.userId, active: false };
        break;
      }
      default: {
        query = {
          $and: [
            { userId: req.userId },
            { active: true },
            {
              $or: [
                { title: { $regex: `.*${search}.*`, $options: 'i' } },
                { activitys: search },
                { tags: search }
              ]
            }
          ]
        };
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

  Kit.find(query)
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
        kits.forEach(function(k) {
          newKits.push({
            _id: k._id,
            title: k.title,
            subtitle: k.subtitle,
            images: k.images,
            inbag: k.inbag.filter(function(i) {
              return i.location.toLowerCase() === search.toLowerCase();
            })
          });
        });
        kits = newKits;
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

// POST request to delete item from kitbag
exports.delete = (req, res, next) => {
  const kitId = req.params.kitId;

  let kitTitle;

  Kit.findById(kitId)
    .then(kit => {
      if (kit.images) {
        kit.images.forEach(img => {
          awsHelper.deleteImage(img.image);
        });
      }
      kitTitle = kit.title;
      return Kit.deleteOne({ _id: kitId, userId: req.userId });
    })
    .then(() => {
      User.findById(req.userId)
        .then(user => {
          user.package.size.kit -= 1;
          return user.save();
        })
        .then(() => {
          res.status(201).json({
            message: `Item of kit "${kitTitle}" successfully deleted.`
          });
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

  Kit.find(query)
    .sort(orderby)
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
