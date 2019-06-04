const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const listSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  items: [
    {
      key: {
        type: Number,
        required: true
      },
      name: {
        type: String,
        required: true
      }    
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('List', listSchema);
