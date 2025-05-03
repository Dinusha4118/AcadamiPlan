const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const Conflict = require('../models/Conflict');
const { generatePDF } = require('../services/pdfService');


const { 
  sendEmailNotification, 
  sendSMSNotification,
  sendPushNotification
} = require('../services/notificationService');

// Get all timetable entries
exports.getAllEntries = async (req, res) => {
  try {
    const entries = await Timetable.find().sort({ day: 1, timeSlot: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new timetable entry with conflict detection
// Create new timetable entry (allow duplicates but detect conflicts)
exports.createEntry = async (req, res) => {
  try {
    const { courseCode, courseName, lecturer, day, timeSlot, lectureHall, color } = req.body;
    
    // Validate input
    if (!courseCode || !courseName || !lecturer || !day || !timeSlot || !lectureHall) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create the new entry (duplicates allowed)
    const newEntry = new Timetable({
      courseCode,
      courseName,
      lecturer,
      day,
      timeSlot,
      lectureHall,
      color,
      isConflict: false
    });

    await newEntry.save();

    // Check for conflicts (excluding current entry)
    const conflictingEntries = await Timetable.find({
      day,
      timeSlot,
      lectureHall,
      _id: { $ne: newEntry._id }
    });

    if (conflictingEntries.length > 0) {
      // Mark all involved entries as conflicts
      await Timetable.updateMany(
        { 
          $or: [
            { _id: newEntry._id },
            { _id: { $in: conflictingEntries.map(e => e._id) } }
          ]
        },
        { $set: { isConflict: true } }
      );

      // Create conflict record
      const conflict = new Conflict({
        timetableEntry: newEntry,
        conflictingEntries,
        status: 'pending'
      });
      await conflict.save();

      return res.status(201).json({
        message: 'Entry created with conflicts',
        entry: newEntry,
        conflictExists: true,
        conflictId: conflict._id
      });
    }

    res.status(201).json({
      message: 'Entry created successfully',
      entry: newEntry,
      conflictExists: false
    });

  } catch (err) {
    console.error('Error creating timetable entry:', err);
    res.status(500).json({ message: 'Server error' });
  }

  if (conflictingEntries.length > 0) {
    // Send notification about conflict
    const notification = await Notification.create({
      type: 'conflict',
      message: `New timetable conflict detected for ${courseCode} in ${lectureHall}`,
      relatedEntry: newEntry._id,
      relatedConflict: conflict._id,
      recipients: ['admins'],
      status: 'unread'
    });
    
    // Emit real-time event
    req.io.emit('newNotification', notification);
    
    // Send email to admins
    const admins = await User.find({ accountType: 'admin' });
    admins.forEach(admin => {
      sendEmailNotification(
        admin.email,
        'New Timetable Conflict',
        `A new conflict has been detected for ${courseCode} in ${lectureHall}`,
        `<p>A new conflict has been detected for <strong>${courseCode}</strong> in <strong>${lectureHall}</strong>.</p>`
      );
    });
  }
};
// Get all conflicts
exports.getAllConflicts = async (req, res) => {
  try {
    const conflicts = await Conflict.find({ status: 'pending' }).lean();
    
    // Transform data to ensure consistent structure
    const formattedConflicts = conflicts.map(conflict => ({
      ...conflict,
      timetableEntry: conflict.timetableEntry || {},
      conflictingEntries: conflict.conflictingEntries || [],
      suggestedSolutions: conflict.suggestedSolutions || []
    }));
    
    res.json(formattedConflicts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
// Resolve conflict
exports.resolveConflict = async (req, res) => {
  try {
    const { conflictId, action, newTimeSlot, newLectureHall } = req.body;
    
    const conflict = await Conflict.findById(conflictId);
    if (!conflict) {
      return res.status(404).json({ message: 'Conflict not found' });
    }

    if (action === 'keepExisting') {
      // Delete the new entry that caused the conflict
      await Timetable.findOneAndDelete({
        courseCode: conflict.timetableEntry.courseCode,
        day: conflict.timetableEntry.day,
        timeSlot: conflict.timetableEntry.timeSlot,
        lectureHall: conflict.timetableEntry.lectureHall
      });
    } else if (action === 'replaceExisting') {
      // Replace one of the existing entries with the new one
      const entryToReplace = conflict.conflictingEntries[0];
      await Timetable.findByIdAndDelete(entryToReplace._id);
      
      const newEntry = new Timetable(conflict.timetableEntry);
      await newEntry.save();
    } else if (action === 'reschedule') {
      // Reschedule the new entry
      const updatedEntry = await Timetable.findOneAndUpdate(
        {
          courseCode: conflict.timetableEntry.courseCode,
          day: conflict.timetableEntry.day,
          timeSlot: conflict.timetableEntry.timeSlot,
          lectureHall: conflict.timetableEntry.lectureHall
        },
        {
          timeSlot: newTimeSlot,
          lectureHall: newLectureHall
        },
        { new: true }
      );
      
      // Check if the new time also has conflicts
      const newConflicts = await Timetable.find({
        day: updatedEntry.day,
        timeSlot: updatedEntry.timeSlot,
        lectureHall: updatedEntry.lectureHall,
        _id: { $ne: updatedEntry._id }
      });
      
      if (newConflicts.length > 0) {
        return res.status(409).json({ 
          message: 'New schedule also has conflicts',
          conflicts: newConflicts
        });
      }
    }

    // Mark conflict as resolved
    conflict.status = 'resolved';
    conflict.resolvedAt = new Date();
    await conflict.save();

    res.json({ message: 'Conflict resolved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update timetable entry
exports.updateEntry = async (req, res) => {
  try {
    const { courseCode, courseName, lecturer, day, timeSlot, lectureHall, color } = req.body;
    
    const entry = await Timetable.findOneAndUpdate(
      { _id: req.params.id},
      { courseCode, courseName, lecturer, day, timeSlot, lectureHall, color },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json(entry);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'This lecture hall is already booked for the selected day and time' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// Delete timetable entry
exports.deleteEntry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const deletedEntry = await Timetable.findByIdAndDelete(req.params.id);

    if (!deletedEntry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
};

// Generate PDF report
exports.generateReport = async (req, res) => {
  try {
    const entries = await Timetable.find().sort({ day: 1, timeSlot: 1 });
    
    if (entries.length === 0) {
      return res.status(400).json({ message: 'No timetable entries found' });
    }

    const pdfBuffer = await generatePDF(entries, req.user);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=timetable-report.pdf'
    });
    
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: 'Error generating PDF report' });
  }
};

// Reorder timetable entries
exports.reorderEntries = async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const bulkOps = entries.map((entryId, index) => ({
      updateOne: {
        filter: { _id: entryId },
        update: { $set: { order: index } }
      }
    }));

    await Timetable.bulkWrite(bulkOps);
    res.json({ message: 'Timetable reordered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add this new method for deleting conflicts
exports.deleteConflict = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // First find the conflict to get associated timetable entries
    const conflict = await Conflict.findById(id);
    if (!conflict) {
      return res.status(404).json({ message: 'Conflict not found' });
    }

    // Delete the main timetable entry that caused the conflict
    await Timetable.findOneAndDelete({
      courseCode: conflict.timetableEntry.courseCode,
      day: conflict.timetableEntry.day,
      timeSlot: conflict.timetableEntry.timeSlot,
      lectureHall: conflict.timetableEntry.lectureHall
    });

    // Delete the conflict record
    await Conflict.findByIdAndDelete(id);

    res.json({ message: 'Conflict and associated entry deleted successfully' });
  } catch (err) {
    console.error('Delete conflict error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update the resolveConflict method
exports.resolveConflict = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, newTimeSlot, newLectureHall } = req.body;
    
    const conflict = await Conflict.findById(id);
    if (!conflict || !conflict.timetableEntry) {
      return res.status(404).json({ message: 'Conflict not found or invalid data' });
    }

    // Safely destructure timetableEntry
    const { courseCode, day, timeSlot, lectureHall } = conflict.timetableEntry;

    if (action === 'keepExisting') {
      await Timetable.findOneAndDelete({ courseCode, day, timeSlot, lectureHall });
    } 
    else if (action === 'replaceExisting' && conflict.conflictingEntries?.length > 0) {
      await Timetable.findByIdAndDelete(conflict.conflictingEntries[0]._id);
      await new Timetable(conflict.timetableEntry).save();
    }
    else if (action === 'reschedule') {
      if (!newTimeSlot || !newLectureHall) {
        return res.status(400).json({ message: 'New time slot and lecture hall required' });
      }
      
      await Timetable.findOneAndUpdate(
        { courseCode, day, timeSlot, lectureHall },
        { timeSlot: newTimeSlot, lectureHall: newLectureHall },
        { new: true }
      );
    }

    conflict.status = 'resolved';
    conflict.resolvedAt = new Date();
    await conflict.save();

    res.json({ message: 'Conflict resolved successfully' });
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.checkConflict = async (req, res) => {
  try {
    const { day, timeSlot, lectureHall } = req.query;
    
    const existingEntry = await Timetable.findOne({
      day,
      timeSlot,
      lectureHall
    });

    res.json({ exists: !!existingEntry });
  } catch (err) {
    res.status(500).json({ message: 'Error checking conflict' });
  }
};

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('relatedEntry', 'courseCode courseName lecturer')
      .populate('relatedConflict', 'timetableEntry conflictingEntries');
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create notification
exports.createNotification = async (req, res) => {
  try {
    const { type, message, relatedEntry, relatedConflict, recipients } = req.body;
    
    const notification = new Notification({
      type,
      message,
      relatedEntry,
      relatedConflict,
      recipients,
      status: 'unread'
    });
    
    await notification.save();
    
    // Emit real-time event
    req.io.emit('newNotification', notification);
    
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get emergency relocation options
exports.getEmergencyRelocationOptions = async (req, res) => {
  try {
    const { day, timeSlot, currentHall } = req.query;
    
    // Find available halls at the same time
    const conflictingEntries = await Timetable.find({ 
      day, 
      timeSlot,
      lectureHall: { $ne: currentHall }
    });
    
    const occupiedHalls = conflictingEntries.map(e => e.lectureHall);
    
    // Get all halls not in use at this time
    const availableHalls = await LectureHall.find({
      hallCode: { $nin: occupiedHalls },
      status: 'Available'
    });
    
    res.json(availableHalls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Auto-relocate class
exports.autoRelocateClass = async (req, res) => {
  try {
    const { entryId } = req.params;
    
    const entry = await Timetable.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Find available halls at the same time
    const availableHalls = await LectureHall.find({
      hallCode: { $ne: entry.lectureHall },
      status: 'Available'
    }).sort({ capacity: -1 });
    
    if (availableHalls.length === 0) {
      return res.status(400).json({ message: 'No available lecture halls' });
    }
    
    // Update the entry with new hall
    const updatedEntry = await Timetable.findByIdAndUpdate(
      entryId,
      { lectureHall: availableHalls[0].hallCode },
      { new: true }
    );
    
    // Create notification
    const notification = new Notification({
      type: 'relocation',
      message: `Class ${entry.courseCode} relocated to ${availableHalls[0].hallCode} due to room unavailability`,
      relatedEntry: entryId,
      recipients: ['all'],
      status: 'unread'
    });
    
    await notification.save();
    
    // Emit real-time event
    req.io.emit('newNotification', notification);
    
    res.json({
      message: 'Class relocated successfully',
      entry: updatedEntry,
      notification
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};