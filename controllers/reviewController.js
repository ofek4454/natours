const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.modifyReviewData = (req, res, next) => {
  if (req.params.tourId) {
    req.body.tour = req.params.tourId;
    req.query.tour = req.params.tourId;
  }
  if (req.user) req.body.author = req.user._id;
  if (req.params.userId) req.query.author = req.params.userId;
  next();
};

exports.isUserAuthor = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (!req.baseUrl.split('/').includes('users'))
    return next(new AppError('To edit/delete review use users route!'));

  const review = await Review.findById(req.params.id);

  if (req.user._id.toString() !== review.author.toString())
    return next(new AppError('You are not the author of this review'));
  next();
});

exports.addReview = handlerFactory.createOne(Review);

exports.getReviews = handlerFactory.getAll(Review);

exports.getReviewById = handlerFactory.getOne(Review);

exports.deleteReview = handlerFactory.deleteOne(Review);

exports.updateReview = handlerFactory.updateOne(Review);
