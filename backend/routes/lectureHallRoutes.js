const express = require('express');
const router = express.Router();
const lectureHallController = require('../controllers/lectureHallController');

// GET all lecture halls
router.get('/', lectureHallController.getAllHalls);

// POST create new lecture hall
router.post('/', lectureHallController.createHall);

// PUT update lecture hall
router.put('/:id', lectureHallController.updateHall);

// DELETE lecture hall
router.delete('/:id', lectureHallController.deleteHall);

module.exports = router;