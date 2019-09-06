const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const groupSchema = new Schema({
  title: {
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
      active: {
        type: Boolean,
        required: true,
        default: false
      }
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
