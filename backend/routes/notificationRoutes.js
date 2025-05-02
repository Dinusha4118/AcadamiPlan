const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/send-sms', notificationController.sendSMS);

module.exports = router;