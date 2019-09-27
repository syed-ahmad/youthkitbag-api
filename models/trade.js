const mongoose = require("mongoose");
const pointSchema = require("./point");

const Schema = mongoose.Schema;

const tradeSchema = new Schema(
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
        enum: ["Point"]
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
    condition: {
      type: String
    },
    askingPrice: {
      type: Number
    },
    traded: {
      type: Boolean
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: "Kit"
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    groups: [
      {
        groupId: {
          type: Schema.Types.ObjectId,
          ref: "Group"
        },
        name: {
          type: String
        },
        available: {
          type: Date
        }
      }
    ],
    tradeDetails: [
      {
        tradedOn: {
          type: Date
        },
        toUserId: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        tradePrice: {
          type: Number
        },
        complete: {
          type: Boolean
        },
        legit: {
          type: Boolean
        },
        messages: [
          {
            type: Schema.Types.ObjectId,
            ref: "Message"
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trade", tradeSchema);
