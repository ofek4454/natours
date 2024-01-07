const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

/////////////// ROUTES ///////////////
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.modifyReviewData, reviewController.getReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.modifyReviewData,
    reviewController.addReview,
  );

router
  .route('/:id')
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.isUserAuthor,
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.isUserAuthor,
    reviewController.deleteReview,
  );

module.exports = router;
