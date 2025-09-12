const bulkFetchService = require('../services/bulkFetchService');
const bulkFetchWorker = require('../workers/bulkFetchWorker');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Start bulk fetch job
// @route   POST /api/bulk-fetch/start
// @access  Private
const startBulkFetch = asyncHandler(async (req, res, next) => {
  const { brands, storeId } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!brands || typeof brands !== 'object' || Object.keys(brands).length === 0) {
    return next(new ErrorResponse('Brands object is required and must contain at least one brand', 400));
  }

  if (!storeId) {
    return next(new ErrorResponse('Store ID is required', 400));
  }

  try {
    // Ensure worker is running
    if (!bulkFetchWorker.isWorkerRunning()) {
      await bulkFetchWorker.start();
    }

    // Create bulk fetch job
    const result = await bulkFetchService.createBulkFetchJob(brands, storeId, userId);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error starting bulk fetch:', error);
    return next(new ErrorResponse('Failed to start bulk fetch job', 500));
  }
});

// @desc    Get job status
// @route   GET /api/bulk-fetch/status/:jobId
// @access  Private
const getJobStatus = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const userId = req.user.id;

  if (!jobId) {
    return next(new ErrorResponse('Job ID is required', 400));
  }

  try {
    const jobStatus = bulkFetchService.getJobStatus(jobId);

    if (!jobStatus) {
      return next(new ErrorResponse('Job not found', 404));
    }

    // Check if user owns this job
    if (jobStatus.userId !== userId) {
      return next(new ErrorResponse('Not authorized to access this job', 403));
    }

    res.status(200).json({
      success: true,
      data: jobStatus
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return next(new ErrorResponse('Failed to get job status', 500));
  }
});

// @desc    Get all user jobs
// @route   GET /api/bulk-fetch/jobs
// @access  Private
const getUserJobs = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { status, limit = 10, offset = 0 } = req.query;

  try {
    const jobs = await bulkFetchService.getUserJobs(userId, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error getting user jobs:', error);
    return next(new ErrorResponse('Failed to get user jobs', 500));
  }
});

// @desc    Start bulk fetch for all brands
// @route   POST /api/bulk-fetch/start-all-brands
// @access  Private
const startAllBrandsFetch = asyncHandler(async (req, res, next) => {
  const { storeId } = req.body;
  const userId = req.user.id;

  if (!storeId) {
    return next(new ErrorResponse('Store ID is required', 400));
  }

  try {
    // Get all brands from GoSport scraper
    const goSportScraper = require('../scrapers/gosport-scraper');
    console.log('🔍 Fetching all brands from GoSport...');
    
    const allBrands = await goSportScraper.getAllBrands();
    
    if (!allBrands || allBrands.length === 0) {
      return next(new ErrorResponse('No brands found to fetch', 404));
    }

    console.log(`✅ Found ${allBrands.length} brands to process`);

    // Convert brands array to brands object format expected by bulk fetch
    const brandsObject = {};
    allBrands.forEach((brand, index) => {
      brandsObject[brand.id || index] = {
        name: brand.name,
        url: brand.url,
        id: brand.id || index
      };
    });

    // Ensure worker is running
    if (!bulkFetchWorker.isWorkerRunning()) {
      await bulkFetchWorker.start();
    }

    // Create bulk fetch job for all brands
    const result = await bulkFetchService.createBulkFetchJob(brandsObject, storeId, userId);

    res.status(201).json({
      success: true,
      message: `Started bulk fetch for ${allBrands.length} brands`,
      totalBrands: allBrands.length,
      data: result
    });
  } catch (error) {
    console.error('Error starting all brands fetch:', error);
    return next(new ErrorResponse('Failed to start all brands fetch job', 500));
  }
});

// @desc    Get job details with products
// @route   GET /api/bulk-fetch/jobs/:jobId/details
// @access  Private
const getJobDetails = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const userId = req.user.id;

  try {
    const jobDetails = await bulkFetchService.getJobDetails(jobId, userId);
    
    if (!jobDetails) {
      return next(new ErrorResponse('Job not found or access denied', 404));
    }
    
    res.status(200).json({
      success: true,
      data: jobDetails
    });
  } catch (error) {
    console.error('Error getting job details:', error);
    return next(new ErrorResponse('Failed to get job details', 500));
  }
});

// @desc    Get job statistics
// @route   GET /api/bulk-fetch/stats
// @access  Private
const getJobStats = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { period = '7d' } = req.query; // 1d, 7d, 30d, all

  try {
    const stats = await bulkFetchService.getJobStats(userId, period);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting job stats:', error);
    return next(new ErrorResponse('Failed to get job statistics', 500));
  }
});

// @desc    Delete completed job
// @route   DELETE /api/bulk-fetch/jobs/:jobId
// @access  Private
const deleteJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const userId = req.user.id;

  try {
    const result = await bulkFetchService.deleteJob(jobId, userId);
    
    if (!result) {
      return next(new ErrorResponse('Job not found or cannot be deleted', 404));
    }
    
    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    return next(new ErrorResponse('Failed to delete job', 500));
  }
});

// @desc    Cancel job
// @route   PUT /api/bulk-fetch/cancel/:jobId
// @access  Private
const cancelJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const userId = req.user.id;

  if (!jobId) {
    return next(new ErrorResponse('Job ID is required', 400));
  }

  try {
    const jobStatus = bulkFetchService.getJobStatus(jobId);

    if (!jobStatus) {
      return next(new ErrorResponse('Job not found', 404));
    }

    // Check if user owns this job
    if (jobStatus.userId !== userId) {
      return next(new ErrorResponse('Not authorized to cancel this job', 403));
    }

    // Check if job can be cancelled
    if (jobStatus.status === 'completed' || jobStatus.status === 'cancelled') {
      return next(new ErrorResponse('Job cannot be cancelled', 400));
    }

    const success = bulkFetchService.cancelJob(jobId);

    if (!success) {
      return next(new ErrorResponse('Failed to cancel job', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Job cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    return next(new ErrorResponse('Failed to cancel job', 500));
  }
});

// @desc    Get worker status
// @route   GET /api/bulk-fetch/worker/status
// @access  Private (Admin only)
const getWorkerStatus = asyncHandler(async (req, res, next) => {
  try {
    const isRunning = bulkFetchWorker.isWorkerRunning();
    
    res.status(200).json({
      success: true,
      data: {
        isRunning,
        status: isRunning ? 'running' : 'stopped'
      }
    });
  } catch (error) {
    console.error('Error getting worker status:', error);
    return next(new ErrorResponse('Failed to get worker status', 500));
  }
});

// @desc    Start worker
// @route   POST /api/bulk-fetch/worker/start
// @access  Private (Admin only)
const startWorker = asyncHandler(async (req, res, next) => {
  try {
    if (bulkFetchWorker.isWorkerRunning()) {
      return res.status(200).json({
        success: true,
        message: 'Worker is already running'
      });
    }

    await bulkFetchWorker.start();
    
    res.status(200).json({
      success: true,
      message: 'Worker started successfully'
    });
  } catch (error) {
    console.error('Error starting worker:', error);
    return next(new ErrorResponse('Failed to start worker', 500));
  }
});

// @desc    Stop worker
// @route   POST /api/bulk-fetch/worker/stop
// @access  Private (Admin only)
const stopWorker = asyncHandler(async (req, res, next) => {
  try {
    if (!bulkFetchWorker.isWorkerRunning()) {
      return res.status(200).json({
        success: true,
        message: 'Worker is already stopped'
      });
    }

    await bulkFetchWorker.stop();
    
    res.status(200).json({
      success: true,
      message: 'Worker stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping worker:', error);
    return next(new ErrorResponse('Failed to stop worker', 500));
  }
});

module.exports = {
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
};