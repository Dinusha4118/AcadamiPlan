const express = require('express');
const Alert = require('../models/alert.model');
//const auth = require('../middleware/auth'); // If you have this, or comment it out for now

const router = express.Router();

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

// Acknowledge alert
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged' },
      { new: true }
    );
    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: 'Error acknowledging alert' });
  }
});

module.exports = router;
