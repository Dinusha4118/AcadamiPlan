const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

// Conflict-specific routes
router.get('/conflicts', timetableController.getAllConflicts);
router.post('/conflicts/:id/resolve', timetableController.resolveConflict);
router.delete('/conflicts/:id', timetableController.deleteConflict);

// Regular timetable routes
router.get('/', timetableController.getAllEntries);
router.post('/', timetableController.createEntry);
router.put('/:id', timetableController.updateEntry);
router.delete('/:id', timetableController.deleteEntry);
router.post('/generate-report', timetableController.generateReport);
router.post('/reorder', timetableController.reorderEntries);
router.get('/check-conflict', timetableController.checkConflict);

// Notification routes
router.get('/notifications', timetableController.getNotifications);
router.post('/notifications', timetableController.createNotification);
router.put('/notifications/:id/read', timetableController.markAsRead);

// Emergency relocation routes
router.get('/emergency-relocation', timetableController.getEmergencyRelocationOptions);
router.post('/auto-relocate/:entryId', timetableController.autoRelocateClass);

module.exports = router;