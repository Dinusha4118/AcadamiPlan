import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  courseName: { type: String, required: true },
  previousLocation: { type: String, required: true },
  newLocation: { type: String, required: true },
  timeChange: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'acknowledged'], 
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Alert', alertSchema);