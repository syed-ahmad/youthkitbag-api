const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    subject: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
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
    hasSent: {
      type: Boolean
    },
    hasRead: {
      type: Boolean
    },
    sourceId: {
      type: Schema.Types.ObjectId
    },
    sourceType: {
      type: String
    },
    sentAt: {
      type: Date
    },
    sentToUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
