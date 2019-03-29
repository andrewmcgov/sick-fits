const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  // anytime a query is the exact same on in both Yoga and Prisma
  // You can forward it right to Prisma using forwardTo
  // Instead of writing it all out - great for queries that need no auth, etc
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if there is a current user ID
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId }
      },
      info
    );
  },
  async users(parent, args, ctx, info) {
    // Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!');
    }
    // Check if the user has permissions to query all the users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);

    // If they do, query the users!
    return ctx.db.query.users({}, info);
  }
};

module.exports = Query;
