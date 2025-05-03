const mongoose = require('mongoose');

const conflictSchema = new mongoose.Schema({
  timetableEntry: {
    courseCode: String,
    courseName: String,
    lecturer: String,
    day: String,
    timeSlot: String,
    lectureHall: String,
    color: String
  },
  conflictingEntries: [{
    _id: mongoose.Schema.Types.ObjectId,
    courseCode: String,
    courseName: String,
    lecturer: String,
    day: String,
    timeSlot: String,
    lectureHall: String,
    color: String
  }],
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending'
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  suggestedSolutions: [{
    solution: String,
    type: {
      type: String,
      enum: ['reschedule', 'changeHall', 'cancel']
    }
  }]
});

// Add pre-save hook to generate suggested solutions
conflictSchema.pre('save', async function(next) {
  if (this.isNew) {
    const solutions = [];
    
    // Solution 1: Reschedule to next available time slot
    const allTimeSlots = ['08:00-09:30', '09:30-11:00', '11:00-12:30', '12:30-14:00', '14:00-15:30', '15:30-17:00'];
    const currentIndex = allTimeSlots.indexOf(this.timetableEntry.timeSlot);
    
    if (currentIndex < allTimeSlots.length - 1) {
      const nextTimeSlot = allTimeSlots[currentIndex + 1];
      solutions.push({
        solution: `Reschedule to ${nextTimeSlot} in ${this.timetableEntry.lectureHall}`,
        type: 'reschedule'
      });
    }
    
    // Solution 2: Change to alternative lecture hall
    const alternativeHalls = ['G601', 'G602', 'G603', 'G604', 'G605', 'G606'];
    const currentHall = this.timetableEntry.lectureHall;
    const altHall = alternativeHalls.find(hall => hall !== currentHall);
    
    if (altHall) {
      solutions.push({
        solution: `Change to Lecture Hall ${altHall} at ${this.timetableEntry.timeSlot}`,
        type: 'changeHall'
      });
    }
    
    // Solution 3: Cancel one of the conflicting entries
    solutions.push({
      solution: `Cancel ${this.conflictingEntries[0].courseName} (${this.conflictingEntries[0].courseCode})`,
      type: 'cancel'
    });
    
    this.suggestedSolutions = solutions;
  }
  
  next();
});

module.exports = mongoose.model('Conflict', conflictSchema);