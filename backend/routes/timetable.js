const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const User = require('../models/User');
const LectureHall = require('../models/LectureHall');

// GET all timetable entries
router.get('/', async (req, res) => {
  try {
    const data = await Timetable.find()
      .populate('courseId', 'name')
      .populate('lecturerId', 'name')
      .populate('hallId', 'name')
      .sort({ order: 1 });

    const formatted = data.map(entry => ({
      ...entry.toObject(),
      course: entry.courseId,
      lecturer: entry.lecturerId,
      hall: entry.hallId
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new timetable entry
router.post('/', async (req, res) => {
  try {
    const { courseId, lecturerId, hallId, day, startTime, endTime, duration } = req.body;

    const newEntry = new Timetable({ courseId, lecturerId, hallId, day, startTime, endTime, duration });
    await newEntry.save();

    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ message: 'Error creating timetable entry', error: err.message });
  }
});

// PUT update timetable entry
router.put('/:id', async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: 'Error updating timetable entry', error: err.message });
  }
});

// DELETE timetable entry
router.delete('/:id', async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting entry', error: err.message });
  }
});

// PUT reorder entry
router.put('/:id/reorder', async (req, res) => {
  try {
    const { newIndex } = req.body;
    const entry = await Timetable.findByIdAndUpdate(req.params.id, { order: newIndex }, { new: true });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: 'Error reordering entry', error: err.message });
  }
});

// Stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      resolutionRate: 75,
      mostCommonConflictType: "Room Double Booking",
      recentResolutions: 5
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/conflicts', async (req, res) => {
  try {
    const conflicts = await Conflict.find().populate('timetableEntry');
    res.json(conflicts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
