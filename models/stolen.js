const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stolenSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  stolenOn: {
    type: Date
  },
  tracking: {
    type: String
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
  security: [String],
  groups: [
    {
      groupId:  {
        type: Schema.Types.ObjectId,
        ref: 'Group'
      },
      name: {
        type: String
      },
      available: {
        type: Date
      }
    }
  ],
  reports: [{
    reportedOn: {
      type: Date
    },
    fromUserId:  {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    details: {
      type: String
    },
    accepted: {
      type: Boolean
    }
  }],
  recovered: {
    type: Boolean
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    ref: 'Kit',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Stolen', stolenSchema);
