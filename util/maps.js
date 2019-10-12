exports.mapGroups = (profile, activitys, userId) => {
  if (!profile.groups || profile.groups.length === 0) {
    return [];
  }

  const groups = profile.groups.map(g => {
    return {
      _id: g._id,
      name: g.name,
      member: g.members
        .filter(m => m.user.toString() === userId.toString())
        .some(m => {
          return m.permissions.includes('member');
        }),
      activity: g.activitys.some(r => activitys.includes(r))
    };
  });

  var event = new Date();
  const today = event
    .toISOString()
    .split('T', 1)[0]
    .concat('T00:00:00.000Z');
  event.setDate(event.getDate() + 7);
  const nextweek = event
    .toISOString()
    .split('T', 1)[0]
    .concat('T00:00:00.000Z');

  return groups
    .filter(g => g.member)
    .map(g => {
      return {
        _id: g._id,
        name: g.name,
        available: g.activity ? today : nextweek,
        include: true //g.activity ? true : false
      };
    })
    .sort(function(x, y) {
      return x.available === y.available
        ? 0
        : x.available < y.available
        ? -1
        : 1;
    });
};
