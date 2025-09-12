const express = require('express');
const {
  startBulkFetch,
  startAllBrandsFetch,
  getJobStatus,
  getUserJobs,
  getJobDetails,
  getJobStats,
  deleteJob,
  cancelJob,
  getWorkerStatus,
  startWorker,
  stopWorker
} = require('../controllers/bulkFetchController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Job management routes
router.post('/start', startBulkFetch);
router.post('/start-all-brands', startAllBrandsFetch);
router.get('/status/:jobId', getJobStatus);
router.get('/jobs', getUserJobs);
router.get('/jobs/:jobId/details', getJobDetails);
router.get('/stats', getJobStats);
router.delete('/jobs/:jobId', deleteJob);
router.put('/cancel/:jobId', cancelJob);

// Worker management routes (admin only - can be extended with admin middleware)
router.get('/worker/status', getWorkerStatus);
router.post('/worker/start', startWorker);
router.post('/worker/stop', stopWorker);

module.exports = router;