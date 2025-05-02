const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


// Protect all routes with admin check


// User management routes
router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/:id')
  .put(userController.updateUser)
  .delete(userController.deleteUser);

router.route('/:id/reset-password')
  .put(userController.resetPassword);

router.get('/', userController.getAllUsers);

module.exports = router;