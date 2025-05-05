const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required:  [true, 'Username is required'],
    unique: true,
    trim: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    maxlength:10,
    minlength:10
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  accountType: {
    type: String,
    required: true,
    enum: ['Student', 'Lecturer', 'Administrative'],
    default: 'Student'
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Add this to your userSchema
userSchema.path('mobile').validate(function(mobile) {
  return /^\d{10}$/.test(mobile);
}, 'Mobile number must be exactly 10 digits');

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Password comparison error:', err);
    throw new Error('Error comparing passwords');
  }
};
module.exports = mongoose.model('User', userSchema);