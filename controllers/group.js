const Group = require('../models/group');
const User = require('../models/user');
const { validationResult } = require('express-validator');
require('../util/array-helper');

const filterOptions = [ { key: 'all', value: 'All' }, { key: 'name', value: 'Name' }, { key: 'activity', value: 'Activity' } ];

// POST request to add a new group for approval
exports.add = (req, res, next) => {
  const { name, tagline, description, email, website, location, activitys } = req.body;
  
  let images = [];
  let imagesToDelete = [];
  if (req.body.images) {
    const approvedImages = req.body.images.filter(i => i.state !== 'D');
    images = approvedImages.map(i => {
      return {...i, state: 'A'}
    });  
    imagesToDelete = req.body.images.filter(i => i.state === 'D');
  }  
  imagesToDelete.forEach(i => {
    awsHelper.deleteImage(i.image);
  });

  let group = new Group({ name, tagline, description, email, website, location, images, activitys });
  
  group.approval = 'requested';
  group.adminId = req.userId;
  group.members = [];

  // add current user as first member
  const member = {
    userId: req.userId,
    state: 'approved',
    stateAt: Date.now(),
    permission: [ 'member', 'admin' ]
  }
  group.members.push(member);
  
  let newGroup;
 
  Group.findOne({ tagline: `${tagline}`})
    .then(existingGroup => {
      if (existingGroup) {
        const error = new Error('A group already exists with this tagline.');
        error.statusCode = 404;
        throw error;
      }

      // no group found that matches the criteria of new group so good to create the new one
      return group.save();
    })
    .then(group => {
      newGroup = group;
      return User.findById(req.userId);
    })
    .then(user => {
      user.package.size.groupadmins += 1;
      user.package.size.groups += 1;
      res.status(201).json({ group: newGroup });
      return user.save();
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
      let currentGroup = { ...group.toObject(), appAdmin: req.appAdmin, groupAdmin: req.groupAdmin, exists: true };
      res.status(200).json(currentGroup);
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
      let currentGroup = { ...group, appAdmin: req.appAdmin, groupAdmin: req.groupAdmin };
      res.status(200).json(currentGroup);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// PUT request to save edited changes to existing group for AppAdmin use only
exports.edit = (req, res, next) => {
  const groupId = req.params.groupId;
  // const tagline = req.body.tagline;

  // let activitys = req.body.activitys;
  // if (activitys) {
  //   activitys = activitys.map(s => s.trim().toLowerCase());
  // }

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
      //group.tagline = tagline;
      //group.activitys = activitys;
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

// PUT request to save edited changes to existing group for AppAdmin use only
exports.deactivate = (req, res, next) => {
  const groupId = req.params.groupId;
  // const tagline = req.body.tagline;

  // let activitys = req.body.activitys;
  // if (activitys) {
  //   activitys = activitys.map(s => s.trim().toLowerCase());
  // }

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
      //group.tagline = tagline;
      //group.activitys = activitys;
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

// PUT request to save edited changes to existing group for AppAdmin use only
exports.editDetails = (req, res, next) => {
  const groupId = req.params.groupId;
  // const tagline = req.body.tagline;

  // let activitys = req.body.activitys;
  // if (activitys) {
  //   activitys = activitys.map(s => s.trim().toLowerCase());
  // }

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
      //group.tagline = tagline;
      //group.activitys = activitys;
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

// PUT request to save edited changes to existing group for AppAdmin use only
exports.editStatus = (req, res, next) => {

  const groupId = req.params.groupId;
  const approval = req.body.approval;
  Group.findById(groupId)
    .then(group => {
      if (!group) {
        const error = new Error('The requested group could not be found');
        error.statusCode = 404;
        throw error;
      }
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

// PUT request to save edited changes to existing group for AppAdmin use only
exports.editMemberStatus = (req, res, next) => {

  const groupId = req.params.groupId;
  const approval = req.body.approval;
  Group.findById(groupId)
    .then(group => {
      if (!group) {
        const error = new Error('The requested group could not be found');
        error.statusCode = 404;
        throw error;
      }
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

// PUT request to save edited changes to existing group for AppAdmin use only
exports.joinMember = (req, res, next) => {

  const groupId = req.params.groupId;
  const approval = req.body.approval;
  Group.findById(groupId)
    .then(group => {
      if (!group) {
        const error = new Error('The requested group could not be found');
        error.statusCode = 404;
        throw error;
      }
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

// PUT request to save edited changes to existing group for AppAdmin use only
exports.leaveMember = (req, res, next) => {

  const groupId = req.params.groupId;
  const approval = req.body.approval;
  Group.findById(groupId)
    .then(group => {
      if (!group) {
        const error = new Error('The requested group could not be found');
        error.statusCode = 404;
        throw error;
      }
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
      default: {
        query = { $and: [ { approval: { $ne: 'blocked'} }, { $or: [{ name: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

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
        ng.memberCount = g.members.length;
        ng.appAdmin = req.appAdmin;
        ng.groupAdmin = (g.adminId.toString() === req.userId.toString());
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

// GET request to return a single group
exports.getItem = (req, res, next) => {
  const { groupId } = req.params;

  Group
    .findById(groupId)
    .then(group => {
      if (!group) {
        const error = new Error('The requested group could not be found');
        error.statusCode = 404;
        throw error;
      }

      // TODO: Need to reduce down the object sent back to user depending on permissions
      // Also need to add permissions to the object itself

      res.status(200).json(kit);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};


// GET request to return page of groups for AppAdmin use only
exports.getMembers = (req, res, next) => {
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
      default: {
        query = { $and: [ { approval: { $ne: 'blocked'} }, { $or: [{ name: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
        break;
      }
    }
  }

  let orderby = { updatedAt: -1 };

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
        ng.memberCount = g.members.length;
        ng.appAdmin = req.appAdmin;
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
//         containers: groups.map(k => k.name)
//       });
//     })
//     .catch(err => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };

