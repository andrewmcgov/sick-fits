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
  },
  async order(parent, args, ctx, info) {
    console.log(ctx.request.userId);
    // make sure they are logged in
    if (!ctx.request.userId) {
      throw new Error('You are not logged in!');
    }
    // Query the current order
    const order = await ctx.db.query.order(
      {
        where: { id: args.id }
      },
      info
    );
    // Check if they have perissions to see this order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermissionsToSeeOrder = ctx.request.user.permissions.includes(
      'ADMIN'
    );
    if (!ownsOrder && !hasPermission) {
      throw new Error('You shal not pass!');
    }
    // Return the order
    return order;
  },
  async orders(parent, args, ctx, info) {
    const { userId } = ctx.request;
    // make sure they are logged in
    if (!userId) {
      throw new Error('You are not logged in!');
    }
    // Query the database for the user's orders
    return await ctx.db.query.orders(
      {
        where: {
          user: { id: userId }
        }
      },
      info
    );
  }
};

module.exports = Query;
