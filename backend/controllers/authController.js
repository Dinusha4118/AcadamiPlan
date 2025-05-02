const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Helper function to handle file upload
const uploadProfilePhoto = async (file) => {
  if (!file) return '';
  
  const uploadDir = path.join(__dirname, '../uploads/profile-photos');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `profile-${uniqueSuffix}${ext}`;
  const filepath = path.join(uploadDir, filename);
  
  await fs.promises.writeFile(filepath, file.buffer);
  return `/uploads/profile-photos/${filename}`;
};


exports.signup = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log incoming data
    console.log('Request file:', req.file); // Log file data
    
    const { username, idNumber, email, mobile, password, accountType } = req.body;
    
    // Validate required fields
    if (!username || !idNumber || !email || !mobile || !password || !accountType) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check mobile number length
    if (mobile.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }, { idNumber }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email, username, or ID number already exists',
        conflicts: {
          email: existingUser.email === email,
          username: existingUser.username === username,
          idNumber: existingUser.idNumber === idNumber
        }
      });
    }
    
    // Handle profile photo upload
    let profilePhotoPath = '';
    if (req.file) {
      try {
        profilePhotoPath = await uploadProfilePhoto(req.file);
      } catch (fileError) {
        console.error('File upload error:', fileError);
        return res.status(400).json({
          success: false,
          message: 'Error uploading profile photo'
        });
      }
    }
    
    // Create new user
    const newUser = new User({
      username,
      idNumber,
      email,
      mobile,
      password,
      accountType,
      profilePhoto: profilePhotoPath
    });
    
    await newUser.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        accountType: newUser.accountType,
        profilePhoto: newUser.profilePhoto
      }
    });
    
  } catch (err) {
    console.error('Signup error:', err);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error',
        field: Object.keys(err.keyPattern)[0]
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Server error during signup',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user exists (with password field)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Remove password before sending response
    user.password = undefined;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        accountType: user.accountType,
        profilePhoto: user.profilePhoto
      }
    });

  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during signin'
    });
  }
};