const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const kitSchema = new Schema({
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
  status: {
    type: String,
    default: 'owned'
  },
  security: String,
  purchases: [
    {
      price : {
        type: Number
      },
      ondate: {
        type: Date
      },
      from: {
        type: String
      },
      quantity: {
        type: Number
      }
    }
  ],
  inbag: [
    {
      location: {
        type: String
      },
      condition: {
        type: String
      },
      quantity: {
        type: Number
      }  
    }
  ],
  warning: {
    type: Number
  },
  images: [
    {
      image: {
        type: String,
        required: true
      },
      imageUrl: {
        type: String,
        required: true
      }  
    }  
  ],
  activitys: [String],
  tags: [String],
  tracking: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Kit', kitSchema);
