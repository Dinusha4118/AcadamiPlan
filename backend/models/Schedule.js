// backend/models/Schedule.js
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true }
}, { timestamps: true });

scheduleSchema.index({ room: 1, startTime: 1, endTime: 1 });

export default mongoose.model('Schedule', scheduleSchema);
