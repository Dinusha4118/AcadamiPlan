// backend/controllers/conflictController.js
import Schedule from '../models/Schedule.js';

// Function to check for schedule conflicts
export const checkScheduleConflict = async (req, res) => {
    try {
        const { course, lecturer, room, startTime, endTime } = req.body;

        const conflict = await Schedule.findOne({
            room,
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
            ]
        });

        if (conflict) {
            return res.status(400).json({ message: 'Schedule conflict detected! Room is already booked.' });
        }

        const newSchedule = new Schedule({ course, lecturer, room, startTime, endTime });
        await newSchedule.save();
        return res.status(201).json({ message: 'Schedule created successfully!' });

    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
};
