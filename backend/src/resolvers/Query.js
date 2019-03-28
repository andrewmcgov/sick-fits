const { forwardTo } = require('prisma-binding');

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
  }
};

module.exports = Query;
