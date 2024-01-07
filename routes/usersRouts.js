const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewsRouts');

const router = express.Router();

router.use('/:userId/reviews', reviewRouter);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), userController.getAllUsers);

router.patch('/updatePassword', authController.updatePassword);

router
  .route('/me')
  .get(userController.getMe, userController.getUserById)
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateAuthenticatedUser,
  )
  .delete(userController.deleteAuthenticatedUser);

router
  .route('/:id')
  .get(userController.getUserById)
  .delete(authController.restrictTo('admin'), userController.deleteUser);

module.exports = router;
