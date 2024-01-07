const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not an image! please upload only images', 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeImages = catchAsync(async (req, res, next) => {
  if (req.files.imageCover) {
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, i) => {
        const imgFileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${imgFileName}`);
        req.body.images.push(imgFileName);
      }),
    );
  }

  next();
});

exports.uploadToursImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAvarage,price';
  req.query.fields = 'name,price,ratingsAvarage,summary,difficulty';
  next();
};

exports.getAllTours = handlerFactory.getAll(Tour);

exports.getTourById = handlerFactory.getOne(Tour, { path: 'reviews' });

exports.createTour = handlerFactory.createOne(Tour);

exports.updateTour = handlerFactory.updateOne(Tour);

exports.deleteTour = handlerFactory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAvarage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numOfTours: { $sum: 1 },
        numOfRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAvarage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numOfTours: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, center, unit } = req.params;
  const [lat, lng] = center.split(',');
  if (!lat || !lng)
    return next(
      new AppError('please provide center in the formar lat,lng', 400),
    );
  let radius;
  if (unit === 'mi') radius = distance / 3963.2;
  else if (unit === 'km') radius = distance / 6378.1;
  else return next(new AppError('please provide a valid unit (mi/km)', 400));

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { center, unit } = req.params;
  const [lat, lng] = center.split(',');
  if (!lat || !lng)
    return next(
      new AppError('please provide center in the formar lat,lng', 400),
    );

  let multiplier;
  if (unit === 'mi') multiplier = 0.000621371;
  else if (unit === 'km') multiplier = 1 / 1000;
  else return next(new AppError('please provide a valid unit (mi/km)', 400));

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    { $match: { secretTour: { $ne: true } } },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
    {
      $sort: { distance: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { distances },
  });
});
