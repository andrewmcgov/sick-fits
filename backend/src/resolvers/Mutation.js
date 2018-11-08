const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if thye are logged in

    // the DB is on ctx because we added it in createServer.js
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args
        }
      },
      info
    );

    return item;
  }
};

module.exports = Mutations;
