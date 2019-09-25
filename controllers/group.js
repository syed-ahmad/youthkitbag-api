const Group = require('../models/group');
const User = require('../models/user');

const filterOptions = [ { key: 'all', value: 'All' }, { key: 'name', value: 'Name' }, { key: 'activity', value: 'Activity' } ];

// POST request to add a new group for status
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
  
  group.status = 'requested';
  group.admin = req.userId;
  group.members = [];

  // add current user as first member
  const member = {
    user: req.userId,
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
      user.profile.groups.push(newGroup._id);
      res.status(200).json({ message: `Group "${newGroup.name}" successfully created. Approval requested.`, group: newGroup });
      return user.save();
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// PUT request to edit status is only available to appAdmin
// awaiting approval, approved, suspended, awaiting deactivation, deactivated
exports.editStatus = (req, res, next) => {
  const groupId = req.params.groupId;
  const status = req.body.status;

  Group.findById(groupId)
    .then(group => {
      group.status = status;
      return group.save();
    })
    .then(group => {
      res.status(200).json({ message: `Status of group "${group.name}" successfully changed to "${status}".`});
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// PUT alter the state for one member request to save edited changes to existing group for AppAdmin use only
exports.editMemberState = (req, res, next) => {
  const { groupId, memberId, state } = req.params;

  const validStates = [ 'approved', 'suspended' ];
  let updated = false;

  Group.findById(groupId)
    .then(group => {
      if (memberId === req.userId) {
        const error = new Error('You are not authorised to change your own member state.');
        error.statusCode = 404;
        throw error;
      }
      if (!validStates.includes(state)) {
        const error = new Error('You have not specified a valid member state.');
        error.statusCode = 404;
        throw error;
      }
      const members = group.members.map(m => {
        if (m.user.toString() !== memberId) return m
        if (m.state !== state) {
          m.state = state;
          m.stateAt = Date.now();
          m.permission = (state === 'suspended') ? [] : ['member'];
          updated = true;
        }
        return m;
      })
      group.members = members;
      return group.save();
    })
    .then(() => {
      const updateMessage = updated ? `Member updated to state ${state}.` : `Member not updated as they already have state ${state}.`;
      res.status(200).json({ message: updateMessage});
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

  // add current user as first member
  const member = {
    user: req.userId,
    state: 'requested',
    stateAt: Date.now(),
    permission: []
  }

  Group.findById(groupId)
    .then(group => {
      group.members.push(member);
      return group.save();
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.package.size.groups += 1;
      user.profile.groups.push(groupId);
      res.status(201).json({ membership: 'requested' });
      return user.save();
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

  let updated = false; 

  Group.findById(groupId)
    .then(group => {
      if (admin === req.userId) {
        const error = new Error('You may not leave a group for which you are the key admin. You must transfer ownership first.');
        error.statusCode = 404;
        throw error;
      }
      const members = group.members.map(m => {
        if (m._id !== req.userId) return m
        if (m.state !== 'left') {
          m.state = 'left';
          m.stateAt = Date.now();
          m.permission = [];
          updated = true;
        }
        return m;
      })
      group.members = members;
      return group.save();
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then(user => {
      if (updated) {
        user.profile.groups = user.profile.groups.filter(g => g !== groupId);
        user.package.size.groups += 1;
      }
      const updateMessage = updated ?
        `Your request to leave this group has been accepted.` : 
        `Your request to leave this group could not be completed.`;
      res.status(201).json(updateMessage);
      return user.save();
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

  // Group.findOne({ _id: { $ne: groupId }, tagline: `${tagline}`})
  //   .then(existingGroup => {
  //     if (existingGroup) {
  //       const error = new Error('A group already exists with this tagline.');
  //       error.statusCode = 404;
  //       throw error;
  //     }
  //     return Group.findById(groupId);
  //   })
  //   .then(group => {
  //     if (!group) {
  //       const error = new Error('The requested group could not be found');
  //       error.statusCode = 404;
  //       throw error;
  //     }
  //     //group.tagline = tagline;
  //     //group.activitys = activitys;
  //     group.status = status;
  //     return group.save();
  //   })
  //   .then(result => {
  //     res.status(200).json({ group: result });
  //   })
  //   .catch(err => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
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
        query = { $and: [ { status: { $ne: 'blocked'} }, { $or: [{ name: { $regex : `.*${search}.*`, $options: 'i' } },{ activitys: search }]}]};
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
      const allGroups = mapGroups(groups, req);
      res.status(200).json({
        groups: allGroups,
        filter: {
          by: by,
          search: search,
          options: filterOptions
        },
        pagination: getPagination(totalItems, itemsPerPage, page, by, search)
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET return all members for group
exports.getMembers = (req, res, next) => {
  const { groupId } = req.params;

  Group
    .findById(groupId)
    .populate({ path: 'members.user' })
    .then(group => {
      const groupMembers = mapMembers(group, req);
      res.status(200).json(groupMembers);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// GET return a single group
exports.getItem = (req, res, next) => {
  const { groupId } = req.params;

  Group
    .findById(groupId)
    .populate({ path: 'admin' })
    .then(group => {
      const groupItem = mapGroup(group, req, true);
      res.status(200).json(groupItem);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

function mapGroups(groups, req) {
  return groups.map(g => {
    let ng = {};
    ng._id = g._id;
    ng.name = g.name;
    ng.status = g.status;
    ng.activitys = g.activitys;
    ng.images = g.images;
    ng.memberCount = g.members.length;
    ng.appAdmin = (req.userId.toString() === process.env.ADMIN_USER);
    return ng;
  });
}

function mapGroup(group, req, incAdmin) {
  return {
    _id: group._id,
    name: group.name,
    tagline: group.tagline,
    description: group.description,
    email: (req.appAdmin || req.groupAdmin) ? group.email : '',
    website: group.website,
    members: group.members.length,
    images: group.images,
    activitys: group.activitys,
    status: group.status,
    readonly: true,
    groupMember: req.groupMember,
    groupAdmin: req.groupAdmin,
    appAdmin: req.appAdmin,
    admin: incAdmin ? mapUser(group.admin) : group.admin
  };
}

function mapMembers(group, req) {
  return { 
    _id: group._id, 
    name: group.name,
    members: group.members.map(m => {
      var rm = {};
      rm._id = m._id;
      rm.state = m.state;
      rm.stateAt = m.stateAt;
      rm.comment = m.comment;
      rm.permission = m.permission;
      rm.user = mapUser(m.user);
      return rm;
    }),
    groupMember: req.groupMember,
    groupAdmin: req.groupAdmin,
    appAdmin: req.appAdmin 
  };
}

function mapUser(user) {
  return {
    _id: user._id,
    username: user.profile.username,
    fullname: user.profile.fullname,
    imageUrl: user.profile.imageUrl
  };
}

function getPagination(totalItems, itemsPerPage, page, by, search) {
  return {
    totalItems: totalItems,
    itemsPerPage: itemsPerPage,
    currentPage: page,
    hasNextPage: itemsPerPage * page < totalItems,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1,
    lastPage: Math.ceil(totalItems / itemsPerPage),
    filterUrl: (by ? `&by=${by}` : '') + (search ? `&search=${search}` : '')
  };
}
