const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('course', 'code name instructor')
      .sort({ enrollmentDate: -1 });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createEnrollment = async (req, res) => {
  try {
    const { courseId, studentId, enrollmentDate } = req.body;
    
    // Validate input
    if (!courseId || !studentId || !enrollmentDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({ 
      course: courseId, 
      studentId 
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Student already enrolled in this course' });
    }
    
    const enrollment = new Enrollment({
      course: courseId,
      studentId,
      enrollmentDate
    });
    
    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.json({ message: 'Enrollment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};