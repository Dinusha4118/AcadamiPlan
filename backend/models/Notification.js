const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['change', 'cancellation', 'relocation', 'conflict', 'reminder']
  },
  message: {
    type: String,
    required: true
  },
  relatedEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable'
  },
  relatedConflict: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conflict'
  },
  recipients: {
    type: [String],
    required: true,
    enum: ['all', 'students', 'lecturers', 'admins']
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add text index for search
notificationSchema.index({ message: 'text' });

module.exports = mongoose.model('Notification', notificationSchema);