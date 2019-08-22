const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user');
const Order = require('../models/order');

const standardPackage = { kit: 100, trade: 25, wanted: 25, photos: 5 };
const premiumPackage = { kit: 1000, trade: 100, wanted: 100, photos: 10 };

exports.postBuyPackage = (req, res, next) => {
  const token = req.body.stripeToken;
  const packageName = req.params.packageName;

  let totalPrice = packageName === 'premium' ? 60.00 : 24.00;

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
        throw new Error(charge.outcome.seller_message);
      }
      return User.findById(req.session.user._id);
    })
    .then(user => {
      user.package.name = packageName;
      user.package.icon = packageName === 'premium' ? 'cocktail' : 'beer'; 
      user.package.max = packageName === 'premium' ? premiumPackage : standardPackage;
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
