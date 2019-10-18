const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true
    },
    password: {
      type: String
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
      firstname: {
        type: String,
        default: ''
      },
      lastname: {
        type: String,
        default: ''
      },
      username: {
        type: String,
        default: ''
      },
      location: {
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'] // 'location.type' must be 'Point'
        },
        coordinates: {
          type: [Number]
        }
      },
      groups: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Group'
        }
      ],
      images: [
        {
          image: String,
          imageUrl: String,
          source: String
        }
      ],
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
        stolen: { type: Number, default: 999 },
        photos: { type: Number, default: 50 },
        groups: { type: Number, default: 3 },
        groupadmins: { type: Number, default: 1 }
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
    resetTokenExpiration: Date,
    thirdpartyAuth: [
      {
        name: String,
        id: String
      }
    ],
    token: String,
    tokenExpiration: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
