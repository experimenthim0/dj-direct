const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  },
  requestsEnabled: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Room', roomSchema);
