const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  tagline: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  website: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  },
  images: [
    {
      image: {
        type: String
      },
      imageUrl: {
        type: String
      }  
    }  
  ],
  activitys: [String],
  members: [
    {
      userId:  {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      state: {
        type: String,
        required: true,
        default: 'apply'
      },
      stateAt: {
        type: Date,
        required: true
      },
      comment: {
        type: String
      },
      permission: [String]
      // an array of permission levels, start with none. When approved then given M = member, but can be raised to M,A = member, admin - allows expansion of permission
    }
  ],
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approval: {
    type: String,
    required: true,
    default: 'requested'
  }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
