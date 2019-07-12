const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const photoSchema = new Schema({
  image: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  sourceId: {
    type: Schema.Types.ObjectId
  },
  sourceType: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Photo', photoSchema);
