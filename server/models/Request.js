const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: false
  },
  deviceId: {
    type: String, // To help with rate limiting per guest
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3 * 60 * 60 // 3 hours in seconds (matches room)
  }
});

module.exports = mongoose.model('Request', requestSchema);
