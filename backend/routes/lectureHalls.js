const express = require('express');
const router = express.Router();
const LectureHall = require('../models/LectureHall');

// GET all lecture halls
router.get('/', async (req, res) => {
  try {
    const halls = await LectureHall.find();
    res.json(halls);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch lecture halls' });
  }
});

// POST new lecture hall
router.post('/', async (req, res) => {
  const { name, capacity, location,facilities } = req.body;
  try {
    const newHall = new LectureHall({ name, capacity, location,facilities });
    await newHall.save();
    res.status(201).json(newHall);
  } catch (err) {
    res.status(400).json({ message: 'Error creating lecture hall', error: err.message });
  }
});

// PUT update lecture hall
router.put('/:id', async (req, res) => {
  try {
    const updated = await LectureHall.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Error updating lecture hall', error: err.message });
  }
});

// DELETE lecture hall
router.delete('/:id', async (req, res) => {
  try {
    await LectureHall.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lecture hall deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting lecture hall', error: err.message });
  }
});

module.exports = router;
