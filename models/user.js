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
    firstname: {
      type: String
    },
    lastname: {
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
    groups: [{
      type: Schema.Types.ObjectId,
      ref: 'Group'
    }],
    activitys: [String],
    badges: [String]
  },
  package: {
    name: { type: String, default: 'free' },
    icon: { type: String, default: 'coffee' },
    max: { 
      kit: { type: Number, default: 20 },
      trade: { type: Number, default: 5 },
      wanted: { type: Number, default: 5 },
      stolen: { type: Number, default: 30 },
      photos: { type: Number, default: 2 },
      groups: { type: Number, default: 3 },
      groupadmins: { type: Number, default: 2 }
    },
    size: {
      kit: { type: Number, default: 0 },
      trade: { type: Number, default: 0 },
      wanted: { type: Number, default: 0 },
      stolen: { type: Number, default: 0 },
      photos: { type: Number, default: 0 },
      groups: { type: Number, default: 0 },
      groupadmins: { type: Number, default: 0 }
    }
  },
  resetToken: String,
  resetTokenExpiration: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
