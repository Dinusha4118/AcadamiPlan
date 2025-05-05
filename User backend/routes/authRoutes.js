const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/^image\/(jpeg|jpg|png|gif)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'), false);
    }
  }
}).single('profilePhoto');

// Update the signup route
router.post('/signup', (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
    // Everything went fine, proceed to controller
    authController.signup(req, res, next);
  });
});

// Signup route


router.post('/signin', authController.signin);

module.exports = router;