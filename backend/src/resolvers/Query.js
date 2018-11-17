const { forwardTo } = require("prisma-binding");

const Query = {
  // anytime a query is the exact same on in both Yoga and Prisma
  // You can forward it right to Prisma using forwardTo
  // Instead of writing it all out - great for queries that need no auth, etc
  items: forwardTo("db"),
  item: forwardTo("db"),
  itemsConnection: forwardTo("db")
};

module.exports = Query;
