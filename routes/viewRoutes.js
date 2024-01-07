const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/me', authController.protect, viewController.getAccount);

router.use(authController.isLoggedIn);

router.get('/', viewController.getOverview);
router.get('/overview', viewController.getOverview);
router.get('/tour/:slug', viewController.getTourDetailsPage);
router.get('/login', viewController.getLogin);

module.exports = router;
