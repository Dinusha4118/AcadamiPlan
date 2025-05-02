const mongoose = require('mongoose');

const lectureHallSchema = new mongoose.Schema({
  hallCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  facilities: {
    type: [String],
    default: []
  },
  building: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Occupied', 'Under Maintenance'],
    default: 'Available'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster searching
lectureHallSchema.index({ hallCode: 1, building: 1, status: 1 });

module.exports = mongoose.model('LectureHall', lectureHallSchema);