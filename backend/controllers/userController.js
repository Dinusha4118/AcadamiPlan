const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Exclude passwords from the response
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, accountType, mobile, idNumber } = req.body;

    // Validate required fields
    if (!username || !email || !password || !accountType || !mobile || !idNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }, { idNumber }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email, username, or ID already exists'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      accountType,
      mobile,
      idNumber
    });

    await newUser.save();

    // Don't return password in response
    newUser.password = undefined;

    res.status(201).json({
      success: true,
      user: newUser
    });

  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error while creating user'
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, accountType, mobile, idNumber } = req.body;

    // Find user and update
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email, accountType, mobile, idNumber },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: updatedUser
    });

  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error while updating user'
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error while deleting user'
    });
  }
};

// Reset password (admin only)
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error while resetting password'
    });
  }
};