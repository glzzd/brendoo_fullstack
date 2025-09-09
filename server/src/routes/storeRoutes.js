const express = require('express');
const {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  getStoresInRadius
} = require('../controllers/storeController');

const router = express.Router();

// Protect all routes
const { protect } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

// Routes
router
  .route('/')
  .get(getStores)
  .post(createStore);

router
  .route('/:id')
  .get(getStore)
  .put(updateStore)
  .delete(deleteStore);

router
  .route('/radius/:zipcode/:distance')
  .get(getStoresInRadius);

module.exports = router;