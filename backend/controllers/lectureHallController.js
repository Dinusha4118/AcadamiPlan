const LectureHall = require('../models/LectureHall');

exports.getAllHalls = async (req, res) => {
  try {
    const halls = await LectureHall.find().sort({ hallCode: 1 });
    res.json(halls);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createHall = async (req, res) => {
  try {
    const { hallCode, capacity, facilities, building, status } = req.body;
    
    if (!hallCode || !capacity || !building) {
      return res.status(400).json({ message: 'Hall code, capacity and building are required' });
    }

    const newHall = new LectureHall({
      hallCode,
      capacity,
      facilities: facilities || [],
      building,
      status: status || 'Available'
    });

    await newHall.save();
    res.status(201).json(newHall);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Lecture hall with this code already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
};

exports.updateHall = async (req, res) => {
  try {
    const { hallCode, capacity, facilities, building, status } = req.body;
    
    const hall = await LectureHall.findByIdAndUpdate(
      req.params.id,
      { hallCode, capacity, facilities, building, status },
      { new: true, runValidators: true }
    );

    if (!hall) {
      return res.status(404).json({ message: 'Lecture hall not found' });
    }

    res.json(hall);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Lecture hall with this code already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
};

exports.deleteHall = async (req, res) => {
  try {
    const hall = await LectureHall.findByIdAndDelete(req.params.id);

    if (!hall) {
      return res.status(404).json({ message: 'Lecture hall not found' });
    }

    res.json({ message: 'Lecture hall deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};