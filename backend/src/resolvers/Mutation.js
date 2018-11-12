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
  },
  updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    // remove the ID from the updates, since it cannot be updated
    delete updates.id;
    // run the update method
    // The the db is on ctx, the method is from the generated prisma file
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // Find the item
    const item = await ctx.db.query.item({ where }, `{id title}`);
    // Check if they own that itme, or have permissions
    // TODO
    // Delete it!
    return ctx.db.mutation.deleteItem({ where }, info);
  }
};

module.exports = Mutations;
