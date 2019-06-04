const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const wantedSchema = new Schema({
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
  offerPrice: {
    type: Number,
    required: true
  },
  offers: [{
    offeredOn: {
      type: Date
    },
    fromUserId:  {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    askingPrice: {
      type: Number
    },
    accepted: {
      type: Boolean
    }
  }],
  activitys: [String],
  obtained: {
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

module.exports = mongoose.model('Wanted', wantedSchema);
