// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Max tour name length is 40 characters'],
      minLength: [10, 'Min tour name length is 10 characters'],
    },
    slug: String,
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium of difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating is between 0-5'],
      max: [5, 'Rating is between 0-5'],
      set: (val) => val.toFixed(1),
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) cannot be more than the price ',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationInWeeks').get(function () {
  return (this.duration / 7).toFixed(2) * 1;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE

// run before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map((id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// run after .save() and .create()
// tourSchema.post('save', function (next) {
//   next();
// });

// QUERY MIDDLEWARE

tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   if (process.env.NODE_ENV === 'development')
//     // eslint-disable-next-line no-console
//     console.log(`Query took ${Date.now() - this.start}ms`);
//   next();
// });

// AGGREGATION MIDDLEWARE

tourSchema.pre('aggregate', function (next) {
  // Check if the pipeline already contains a $geoNear stage
  const geoNearStage = this.pipeline().find((stage) => stage.$geoNear);

  // If there is no $geoNear stage, add the $match stage for hiding secret tours
  if (!geoNearStage) {
    this.pipeline().unshift({
      $match: { secretTour: { $ne: true } },
    });
  }

  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
