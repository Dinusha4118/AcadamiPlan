const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  studentId: {
    type: String,
    required: true,
    trim: true
  },
  enrollmentDate: {
    type: Date,
    required: true,
    default: Date.now
  }
});

// Index for faster queries
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ studentId: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);