const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    products: [
      {
        product: { type: String, required: true },
        quantity: { type: Number, required: true }
      }
    ],
    user: {
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
