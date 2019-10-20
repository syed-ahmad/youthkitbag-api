const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const marketSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    marketType: {
      type: String,
      required: true
    },
    subtitle: String,
    description: String,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    images: [
      {
        image: String,
        imageUrl: String
      }
    ],
    activitys: [String],
    condition: String,
    security: [String],
    tracking: String,
    occurredOn: Date,
    freeTrade: Boolean,
    marketPrice: Number,
    completed: Boolean,
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
        groupId: {
          type: Schema.Types.ObjectId,
          ref: 'Group'
        },
        name: String,
        available: Date,
        include: Boolean
      }
    ],
    responseDetails: [
      {
        responseOn: Date,
        fromUserId: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        details: String,
        responsePrice: Number,
        accepted: Boolean,
        legit: Boolean,
        messages: [
          {
            type: Schema.Types.ObjectId,
            ref: 'Message'
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Market', marketSchema);
