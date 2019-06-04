const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stolenSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  stolenOn: {
    type: Date
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  tracking: {
    type: String
  },
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
  activitys: [String],
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
