const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stolenSchema = new Schema(
  {
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
    stolenOn: {
      type: Date
    },
    tracking: {
      type: String
    },
    recovered: {
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
        groupId: {
          type: Schema.Types.ObjectId,
          ref: 'Group'
        },
        name: {
          type: String
        },
        available: {
          type: Date
        },
        include: {
          type: Boolean
        }
      }
    ],
    reportDetails: [
      {
        reportedOn: {
          type: Date
        },
        fromUserId: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        details: {
          type: String
        },
        accepted: {
          type: Boolean
        },
        legit: {
          type: Boolean
        },
        messages: [
          {
            toOwner: {
              type: Boolean
            },
            sentDate: {
              type: Date
            },
            title: {
              type: String
            },
            body: {
              type: String
            },
            draft: {
              type: Boolean
            },
            read: {
              type: Boolean
            }
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stolen', stolenSchema);
