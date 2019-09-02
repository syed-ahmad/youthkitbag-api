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
  offerPrice: {
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
