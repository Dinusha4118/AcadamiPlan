const Course = require('../models/Course');

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ code: 1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { code, name, instructor, credits, schedule } = req.body;
    
    // Validate input
    if (!code || !name || !instructor || !credits || !schedule) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const course = new Course({
      code,
      name,
      instructor,
      credits,
      schedule
    });
    
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Course code already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { code, name, instructor, credits, schedule } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { code, name, instructor, credits, schedule },
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Course code already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};