const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  passwordAttempts: {
    type: Number,
    default: 0
  },
  locked: {
    type: Boolean,
    default: false
  },
  profile: {
    image: {
      type: String
    },
    imageUrl: {
      type: String
    },
    username: {
      type: String
    },
    location: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
      },
      coordinates: {
        type: [Number]
      }
    },
    groups: [String],
    activitys: [String],
    badges: [String]
  },
  package: {
    name: { type: String, default: 'free' },
    icon: { type: String, default: 'coffee' },
    max: { 
      kit: { type: Number, default: 20 },
      forsale: { type: Number, default: 5 },
      wanted: { type: Number, default: 5 },
      photos: { type: Number, default: 2 }
    },
    size: {
      kit: { type: Number, default: 0 },
      forsale: { type: Number, default: 0 },
      wanted: { type: Number, default: 0 },
      photos: { type: Number, default: 0 }
    }
  },
  resetToken: String,
  resetTokenExpiration: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
