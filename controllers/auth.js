const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { validationResult} = require('express-validator/check');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const DOMAIN_URL = process.env.DOMAIN_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET;

const VALIDATION_FAILED = 'Validation failed';
const INVALID_CREDENTIALS = 'You have entered an invalid email or password';
const RESET_TOKEN_EXPIRED = 'The reset password token has expired. Please request a new reset password token.';
const ACCOUNT_LOCKED = 'Your account has been locked out. Please reset your password.';
const PASSWORD_RESET = 'Your account password has been reset. Please not login using your new password.';

sgMail.setApiKey(SENDGRID_API_KEY);

exports.login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(VALIDATION_FAILED);
    error.statusCode = 422;
    error.errors = errors.array();
    throw error;
  }
  
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        const error = new Error(INVALID_CREDENTIALS);
        error.statusCode = 401; 
        throw error;
      }
      if (user.locked) {
        const error = new Error(ACCOUNT_LOCKED);
        error.statusCode = 401; 
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then(passwordsMatch => {
      if (!passwordsMatch) {
        loadedUser.passwordAttempts++;
        if (loadedUser.passwordAttempts >= 3) {
          loadedUser.locked = true;
        }
        return loadedUser
          .save()
          .then(user => {
            if (user.locked) {
              const error = new Error(ACCOUNT_LOCKED);
              error.statusCode = 401; 
              throw error;
            }    
            const error = new Error(INVALID_CREDENTIALS);
            error.statusCode = 401; 
            throw error;  
          })
          .catch(err => { 
            throw err;
          });
      }
      const token = jwt.sign({ 
          email: loadedUser.email,
          userId: loadedUser._id.toString()
        }, JWT_SECRET, { expiresIn: '1h'}
      );
      res.status(200).json({ token: token, userId: loadedUser._id.toString() })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(VALIDATION_FAILED);
    error.statusCode = 422;
    error.errors = errors.array();
    throw error;
  }

  const email = req.body.email;
  const password = req.body.password;

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword
      });
      return user.save();
    })
    .then(result => {
      res.status(201).json({ message: 'User was created', userId: result._id });
      const msg = {
        to: email,
        from: 'admin@youthkitbag.com',
        subject: 'YouthKitbag Signup Successful',
        text: 'Thank you for signing up to this service'
      };
      return sgMail.send(msg);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.reset = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(VALIDATION_FAILED);
    error.statusCode = 422;
    error.errors = errors.array();
    throw error;
  }

  const email = req.body.email;

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      err.statusCode = 500;
      throw err;
    }
    const token = buffer.toString('hex');
    User
      .findOne({email: email})
      .then(user => {
        if (!user) {
          const error = new Error(INVALID_CREDENTIALS);
          error.statusCode = 401; 
          throw error;
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        user.passwordAttempts = 0;
        user.locked = false;
        return user.save();
      })
      .then(result => {
        res.status(200).json({ message: 'Password reset requested (token shown for testing)', token: token });
        const msg = {
          to: email,
          from: 'admin@youthkitbag.com',
          subject: 'YouthKitbag Reset Password',
          text: `
            <p>You requested a password reset</p>
            <p>Click this <a href="${DOMAIN_URL}/reset/${token}">link</a> to set a new password</p>
          `
        };
        return sgMail.send(msg);
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User
    .findOne({
      resetToken: token, 
      resetTokenExpiration: {$gt: Date.now()}
    })
    .then(user => {
      if (!user) {
        const error = new Error(RESET_TOKEN_EXPIRED);
        error.statusCode = 401; 
        throw error;
      }
      res.status(200).json({
        passwordToken: token,
        userId: user._id.toString()
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
  };

exports.postNewPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(VALIDATION_FAILED);
    error.statusCode = 422;
    error.errors = errors.array();
    throw error;
  }

  const userId = req.body.userId;
  const newPassword = req.body.password;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User
    .findOne({
      resetToken: passwordToken, 
      resetTokenExpiration: {$gt: Date.now()}, 
      _id: userId
    })
    .then(user => {
      if (!user) {
        const error = new Error(RESET_TOKEN_EXPIRED);
        error.statusCode = 401; 
        throw error;
      }
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.status(200).json({ message: PASSWORD_RESET });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

