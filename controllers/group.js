const Group = require('../models/group');
const User = require('../models/user');
const { validationResult} = require('express-validator/check');

//const filterOptions = [ { key: 'all', value: 'All' }, { key: 'name', value: 'Name' }, { key: 'activity', value: 'Activity' }, { key: 'requested', value: 'Requested' }, { key: 'blocked', value: 'Blocked' } ];
const filterOptions = [ { key: 'all', value: 'All' }, { key: 'name', value: 'Name' }, { key: 'activity', value: 'Activity' } ];

// POST request to add a new group for approval
exports.add = (req, res, next) => {
  console.log(req.body);
  const name = req.body.name;
  const tagline = req.body.tagline;
  const description = req.body.description;
  const email = req.body.email;
  const website = req.body.website;
  const location = req.body.location;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  const approvalImages = req.body.images.filter(i => i.state !== 'D');
  const images = approvalImages.map(i => {
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
      group: {
        name: name,
        tagline: tagline,
        description: description,
        email: email,
        website: website,
        location: location,
        activitys: activitys
      },
      errors: errors,
      editing: false
    });
  }

  const group = new Group({
    name: name,
    tagline: tagline,
    description: description,
    email: email,
    website: website,
    location: location,
    images: images,
    activitys: activitys,
    approval: 'requested',
    adminId: req.userId
  });
  
  imagesToDelete.forEach(i => {
    awsHelper.deleteImage(i.image);
  });

  let currentUser;

  User
    .findById(req.userId)
    .then (user => {
      if (user.package.size.groupadmins >= user.package.max.groupadmins) {
        const error = new Error('You have already reached the limit of groups that you can be administrator for. Please upgrade your account.');
        error.statusCode = 404;
        throw error;
      }
      currentUser = user;
      return Group.findOne({ tagline: `${tagline}`});
    })
    .then(existingGroup => {
      if (existingGroup) {
        const error = new Error('A group already exists with this tagline.');
        error.statusCode = 404;
        throw error;
      }
      return group.save();
    })
    .then(addedGroup => {
      currentUser.package.size.groupadmins += 1;
      res.status(201).json({ group: addedGroup });
      return currentUser.save();
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request to get an already existing group for GroupAdmin use only
exports.getItem = (req, res, next) => {
  const groupId = req.params.groupId;

  Group
    .findById(groupId)
    .then(group => {
      if (!group) {
        const error = new Error('The requested item of group could not be found');
        error.statusCode = 404;
        throw error;
      }
      if (group.adminId.toString() !== req.userId.toString()) {
        const error = new Error('You are not authorized to edit this item of group');
        error.statusCode = 403;
        throw error;
      }
      res.status(200).json(group);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request to get an already existing group for AppAdmin use only
exports.get = (req, res, next) => {
  const groupId = req.params.groupId;

  Group
    .findById(groupId)
    .then(group => {
      if (!group) {
        const error = new Error('The requested group could not be found');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json(group);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request to get an already existing group for AppAdmin use only
exports.getDetails = (req, res, next) => {
  const groupId = req.params.groupId;

  Group
    .findById(groupId)
    .then(group => {
      if (!group) {
        const error = new Error('The requested group could not be found');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json(group);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// PUT request to save edited changes to existing group for AppAdmin use only
exports.editDetails = (req, res, next) => {
  const groupId = req.params.groupId;
  const tagline = req.body.tagline;

  let activitys = req.body.activitys;
  if (activitys) {
    activitys = activitys.map(s => s.trim().toLowerCase());
  }

  const approval = req.body.approval;

  Group.findOne({ _id: { $ne: groupId }, tagline: `${tagline}`})
    .then(existingGroup => {
      if (existingGroup) {
        const error = new Error('A group already exists with this tagline.');
        error.statusCode = 404;
        throw error;
      }
      return Group.findById(groupId);
    })
    .then(group => {
      if (!group) {
        const error = new Error('The requested group could not be found');
        error.statusCode = 404;
        throw error;
      }
      group.tagline = tagline;
      group.activitys = activitys;
      group.approval = approval;
      return group.save();
    })
    .then(result => {
      res.status(200).json({ group: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET request to return page of groups for AppAdmin use only
exports.getItems = (req, res, next) => {
  let by = req.query.by;
  let search = req.query.search;
  const page = +req.query.page || 1;
  const itemsPerPage = +req.query.pagesize || 24;
  let totalItems;

  let query = { };

  if (search || by) {
    search = search ? search.toLowerCase() : '';
    switch (by) {
      case 'name': {
        query = { name: { $regex : `.*${search}.*`, $options: 'i' } };
        break;
      }
      case 'activity': {
        query = { activitys: search };
        break;
      }
      // case 'requested': {
      //   query = { approval: 'requested' };
      //   break;
      // }
      // case 'blocked': {
      //   query = { approval: 'blocked' };
      //   break;
      // }
      default: {
        query = { $and: [ { approval: { $ne: 'blocked'} }, { $or: [{ name: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };
console.log(query);
  Group
    .find(query)
    .countDocuments()
    .then(numberOfItems => {
      totalItems = numberOfItems;
      return Group.find(query)
        .sort(orderby)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then(groups => {
      const allGroups = groups.map(g => {
        let ng = {};
        ng._id = g._id;
        ng.name = g.name;
        ng.approval = g.approval;
        ng.activitys = g.activitys;
        ng.images = g.images;
        return ng;
      });
      res.status(200).json({
        groups: allGroups,
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

// // POST request to delete item from groupbag
// exports.delete = (req, res, next) => {
//   const groupId = req.params.groupId;
  
//   Group.findById(groupId)
//     .then(group => {
//       if (!group) {
//         const error = new Error('Group not found');
//         error.statusCode = 404;
//         throw error;
//       }
//       if (group.userId.toString() !== req.userId.toString()) {
//         const error = new Error('You are not authorized to delete this item of group');
//         error.statusCode = 403;
//         throw error;
//       }
//       if (group.images) {
//         group.images.forEach((img, i) => {
//           awsHelper.deleteImage(img.image);
//         });
//       }
//       return Group.deleteOne({ _id: groupId, userId: req.userId });
//     })
//     .then(() => {
//       User
//       .findById(req.userId)
//       .then (user => { 
//         user.package.size.group -= 1;
//         return user.save();
//       })
//       .then(() => {
//         res.status(200).json({ message: 'Group item deleted'});
//       });
//     })
//     .catch(err => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };

// // GET request to return page of items from users groupbag
// exports.getContainers = (req, res, next) => {

//   let query = { userId: req.userId, approval: true, tags: 'container' };
//   let orderby = { name: 1 };

//   Group
//     .find(query).sort(orderby)
//     .then(groups => {
//       res.status(200).json({
//         containers: groups.map(k => k.title)
//       });
//     })
//     .catch(err => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };

