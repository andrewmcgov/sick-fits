const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if thye are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to make an item!');
    }
    // the DB is on ctx because we added it in createServer.js
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // This is how we make a connection between the item and the user in Prisma
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
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
    const item = await ctx.db.query.item({ where }, `{id title user { id }}`);
    // Check if they own that itme, or have permissions
    // TODO
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN', 'ITEMDELETE'].includes(permission)
    );
    if (!ownsItem && !hasPermissions) {
      throw new Error('You cannot delete this item!');
    }
    // Delete it!
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    // hash the password
    const password = await bcrypt.hash(args.password, 10);
    // create user in database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] }
        }
      },
      info
    );
    // create the JWT token for the new user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // Set JWT as a cookie on the reponse
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year token
    });
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // Check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }

    // Check if the password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password!');
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    // Set cookie with token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });

    // Reuturn user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'You have been signed out!' };
  },
  async requestReset(parent, args, ctx, info) {
    const randomBytesPromisified = promisify(randomBytes);
    // Check that this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for ${args.email}`);
    }
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });

    // Email the reset token
    const mailRes = await transport.sendMail({
      from: 'andrew@andrew.com',
      to: user.email,
      subject: 'Your password reset link',
      html: makeANiceEmail(`
        Your password reset token is here!
        \n\n
        <a href={"${
          process.env.FRONTEND_URL
        }/reset?resetToken=${resetToken}"}>Click here to reset!</a>
      `)
    });

    return { message: 'thanks!' };
  },
  async resetPassword(parent, args, ctx, info) {
    // Check if the password match
    const { resetToken, password, confirmPassword } = args;

    if (password !== confirmPassword) {
      throw new Error(`The passwords do not match!`);
    }

    // Check if its a legit reset token
    // Check if it's Expired
    const [user] = await ctx.db.query.users({
      where: { resetToken: args.resetToken },
      resetTokenExpiry_gte: Date.now() - 360000
    });
    if (!user) {
      throw new Error(`This token is either invalid or expired`);
    }

    // Hash their new password
    const hash = await bcrypt.hash(args.password, 10);

    // Save password to DB, and remove the old resetToken
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: { password: hash, resetToken: null, resetTokenExpiry: null }
    });

    // create the JWT token for the  user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    // Set JWT as a cookie on the reponse
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year token
    });

    // Return the new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error(`You must be logged in!`);
    }
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId
        }
      },
      info
    );
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions
          }
        },
        where: {
          id: args.userId
        }
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // Make sure that they are signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be signed in son!');
    }
    // Query the user's cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    });
    // Check if that item is already in the cart and increment by 1 if it is
    if (existingCartItem) {
      console.log('This item is alredy in their cart');
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1 },
        info
      });
    }
    // If it is not already in cart, creat a fresh CartItem for that user.
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId }
        },
        item: {
          connect: { id: args.id }
        }
      },
      info
    });
  },
  async removeFromCart(parent, args, ctx, info) {
    // Find the cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: { id: args.id }
      },
      `{id, user { id }}`
    );
    // Make sure we found an Item
    if (!cartItem) throw new Error('No cartItem found!');
    // Make sure they own the cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('This cartItem is not in your cart!');
    }
    // Delete the cart item

    return await ctx.db.mutation.deleteCartItem(
      {
        where: { id: args.id }
      },
      info
    );
  },
  async createOrder(parent, args, ctx, info) {
    // Query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId)
      throw new Error('You must be signed in to complete this order');
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `
        {
          id
          name
          email
          cart {
            id
            quantity
            item { title price id description image largeImage }
          }
        }
      `
    );
    // recalculate the total for the price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );

    console.log(`charging for ${amount}`);

    // Create the stripe chrge - turn token into $$$
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token
    });

    // Conver the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } }
      };
      delete orderItem.id;
      return orderItem;
    });

    // Create the order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        // prisma lets us create the order items in the order creation on the fly 🚀
        items: { create: orderItems },
        user: { connect: { id: userId } }
      }
    });

    // Clean up the users cart and delete items
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({
      where: { id_in: cartItemIds }
    });

    // Return the order to the client
    return order;
  }
};

module.exports = Mutations;
