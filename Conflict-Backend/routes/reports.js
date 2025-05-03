const express = require('express');
const router = express.Router();
const { generateCoursesReport } = require('../controllers/reportController');

// GET /api/reports/courses
router.get('/courses', generateCoursesReport);

module.exports = router;
