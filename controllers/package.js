const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user');
const Order = require('../models/order');

// keeping defaults listed here for comparison
// eslint-disable-next-line no-unused-vars
const freePackage = {
  kit: 20,
  trade: 5,
  wanted: 5,
  stolen: 999,
  photos: 50,
  groups: 3,
  groupadmins: 1
};

const standardPackage = {
  kit: 200,
  trade: 50,
  wanted: 50,
  stolen: 999,
  photos: 500,
  groups: 9,
  groupadmins: 3
};

const premiumPackage = {
  kit: 2000,
  trade: 500,
  wanted: 500,
  stolen: 999,
  photos: 5000,
  groups: 27,
  groupadmins: 9
};

exports.postBuyPackage = (req, res, next) => {
  const token = req.body.stripeToken;
  const packageName = req.params.packageName;

  let totalPrice = packageName === 'premium' ? 60.0 : 24.0;

  const order = new Order({
    user: {
      name: req.user.name,
      userId: req.user
    },
    products: [{ quantity: 1, product: packageName }]
  });

  order
    .save()
    .then(result => {
      return stripe.charges.create({
        amount: totalPrice * 100,
        currency: 'gbp',
        description: 'Package purchase from YouthKitbag',
        source: token,
        metadata: {
          order_id: result._id.toString()
        }
      });
    })
    .then(charge => {
      if (!charge || charge.outcome.type != 'authorized') {
        throw new Error(charge.outcome.tradeer_message);
      }
      return User.findById(req.session.user._id);
    })
    .then(user => {
      user.package.name = packageName;
      user.package.icon = packageName === 'premium' ? 'cocktail' : 'beer';
      user.package.max =
        packageName === 'premium' ? premiumPackage : standardPackage;
      return user.save();
    })
    .then(user => {
      req.session.user = user;
      return req.session.save(err => {
        console.log(err);
      });
    })
    .then(() => {
      res.redirect('/kitbag');
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
