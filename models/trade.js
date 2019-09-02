const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tradeSchema = new Schema({
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
  condition: {
    type: String,
    required: true
  },
  askingPrice: {
    type: Number,
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
  tradeDetails: {
    tradedOn: {
      type: Date
    },
    toUserId:  {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    tradePrice: {
      type: Number
    },
    complete: {
      type: Boolean
    }
  },
  traded: {
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

module.exports = mongoose.model('Trade', tradeSchema);
