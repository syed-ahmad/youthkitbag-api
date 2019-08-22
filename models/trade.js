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
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'] // 'location.type' must be 'Point'
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
  sold: {
    soldOn: {
      type: Date
    },
    toUserId:  {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    salePrice: {
      type: Number
    },
    completed: {
      type: Boolean
    }
  },
  activitys: [String],
  hasSold: {
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