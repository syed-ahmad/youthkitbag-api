const mongoose = require('mongoose');
const pointSchema = require('./point');

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
    type: String
  },
  location: {
    type: pointSchema
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
  offerPrice: {
    type: Number
  },
  obtained: {
    type: Boolean
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    ref: 'Kit'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  offerDetails: [{
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
  }]
}, { timestamps: true });

module.exports = mongoose.model('Wanted', wantedSchema);
