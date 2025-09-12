const simpleQueue = require('../config/simpleQueue');
const socketManager = require('../config/socket');
const { v4: uuidv4 } = require('uuid');

class BulkFetchService {
  constructor() {
    this.activeJobs = new Map(); // Store active job statuses
  }

  /**
   * Create and queue bulk fetch jobs for brands
   * @param {Object} brands - Object containing brand names and URLs
   * @param {string} storeId - Store ID
   * @param {string} userId - User ID
   * @returns {Object} Job information
   */
  async createBulkFetchJob(brands, storeId, userId) {
    try {
      const jobId = uuidv4();
      const brandEntries = Object.entries(brands);
      const totalBrands = brandEntries.length;

      if (totalBrands === 0) {
        throw new Error('No brands provided for bulk fetch');
      }

      // Initialize job status
      const jobStatus = {
        jobId,
        storeId,
        userId,
        status: 'queued',
        totalBrands,
        processedBrands: 0,
        successfulBrands: 0,
        failedBrands: 0,
        startTime: new Date(),
        endTime: null,
        brands: [],
        products: [],
        errors: []
      };

      this.activeJobs.set(jobId, jobStatus);

      // Create individual jobs for each brand
      for (let i = 0; i < brandEntries.length; i++) {
        const [brandKey, brandData] = brandEntries[i];
        const brandName = brandData.name || brandKey;
        const brandUrl = brandData.url || brandData;
        const safeUrl = typeof brandUrl === 'string' ? brandUrl.trim().replace(/"/g, '') : String(brandUrl || '').replace(/"/g, '');

        const brandJob = {
          jobId,
          brandIndex: i,
          brandName,
          brandUrl: safeUrl,
          storeId,
          userId,
          totalBrands,
          createdAt: new Date()
        };

        // Queue the brand job
        await simpleQueue.publishJob('bulk_fetch_queue', brandJob);
      }

      console.log(`✅ Created bulk fetch job ${jobId} with ${totalBrands} brands`);
      
      return {
        success: true,
        jobId,
        totalBrands,
        message: `Bulk fetch job created with ${totalBrands} brands`
      };
    } catch (error) {
      console.error('❌ Error creating bulk fetch job:', error);
      throw error;
    }
  }

  /**
   * Update job progress with enhanced error handling and retry mechanism
   * @param {string} jobId - Job ID
   * @param {Object} brandResult - Brand processing result
   */
  updateJobProgress(jobId, brandResult) {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      console.warn(`⚠️ Job ${jobId} not found in active jobs`);
      return;
    }

    job.processedBrands++;
    job.lastUpdated = new Date();
    
    if (brandResult.success) {
      job.successfulBrands++;
      job.products.push(...brandResult.products);
      console.log(`✅ Brand ${brandResult.brandName} processed successfully with ${brandResult.products.length} products`);
    } else {
      job.failedBrands++;
      
      // Enhanced error tracking
      const errorInfo = {
        brandName: brandResult.brandName,
        brandUrl: brandResult.brandUrl,
        error: brandResult.error,
        errorType: brandResult.errorType || 'unknown',
        retryCount: brandResult.retryCount || 0,
        timestamp: new Date(),
        canRetry: brandResult.canRetry !== false
      };
      
      job.errors.push(errorInfo);
      
      // Check if brand can be retried
      if (errorInfo.canRetry && errorInfo.retryCount < 3) {
        console.log(`⚠️ Brand ${brandResult.brandName} failed, will retry (attempt ${errorInfo.retryCount + 1}/3)`);
        // Add to retry queue
        this.scheduleRetry(jobId, brandResult, errorInfo.retryCount + 1);
      } else {
        console.error(`❌ Brand ${brandResult.brandName} failed permanently:`, brandResult.error);
      }
    }

    job.brands.push({
      name: brandResult.brandName,
      url: brandResult.brandUrl,
      status: brandResult.success ? 'completed' : 'failed',
      productCount: brandResult.products ? brandResult.products.length : 0,
      error: brandResult.error || null,
      retryCount: brandResult.retryCount || 0,
      processedAt: new Date()
    });

    // Calculate success rate
    const successRate = job.processedBrands > 0 ? job.successfulBrands / job.processedBrands : 0;
    job.successRate = Math.round(successRate * 100);

    // Update job status
    if (job.processedBrands === job.totalBrands) {
      // Determine final status based on success rate
      let finalStatus = 'completed';
      if (successRate === 0) {
        finalStatus = 'failed';
      } else if (successRate < 0.5) {
        finalStatus = 'completed_with_errors';
      }
      
      job.status = finalStatus;
      job.endTime = new Date();
      
      console.log(`✅ Bulk fetch job ${jobId} ${finalStatus} with ${job.successRate}% success rate`);
      
      // Emit job completion via WebSocket
      socketManager.emitJobComplete(jobId, {
        status: finalStatus,
        totalBrands: job.totalBrands,
        successfulBrands: job.successfulBrands,
        failedBrands: job.failedBrands,
        totalProducts: job.products.length,
        successRate: job.successRate,
        duration: job.endTime - job.startTime,
        hasErrors: job.failedBrands > 0
      });
    } else {
      job.status = 'processing';
    }

    this.activeJobs.set(jobId, job);
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {Object|null} Job status
   */
  getJobStatus(jobId) {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all active jobs for a user with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Jobs with pagination info
   */
  getUserJobs(userId, options = {}) {
    const { status, limit = 10, offset = 0 } = options;
    const userJobs = [];
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.userId === userId) {
        if (!status || job.status === status) {
          userJobs.push(job);
        }
      }
    }
    
    // Sort by start time (newest first)
    userJobs.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    // Apply pagination
    const paginatedJobs = userJobs.slice(offset, offset + limit);
    
    return {
      jobs: paginatedJobs,
      pagination: {
        total: userJobs.length,
        limit,
        offset,
        hasMore: offset + limit < userJobs.length
      }
    };
  }

  /**
   * Get job details with products grouped by brand
   * @param {string} jobId - Job ID
   * @param {string} userId - User ID
   * @returns {Object|null} Job details
   */
  getJobDetails(jobId, userId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job || job.userId !== userId) {
      return null;
    }
    
    // Group products by brand
    const productsByBrand = {};
    if (job.products) {
      job.products.forEach(product => {
        const brandName = product.brandName || 'Unknown';
        if (!productsByBrand[brandName]) {
          productsByBrand[brandName] = [];
        }
        productsByBrand[brandName].push(product);
      });
    }
    
    return {
      ...job,
      productsByBrand,
      totalProducts: job.products ? job.products.length : 0
    };
  }

  /**
   * Get job statistics for a user
   * @param {string} userId - User ID
   * @param {string} period - Time period (1d, 7d, 30d, all)
   * @returns {Object} Job statistics
   */
  getJobStats(userId, period = '7d') {
    let dateFilter = new Date();
    
    switch (period) {
      case '1d':
        dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        dateFilter = new Date(0); // Beginning of time
        break;
    }
    
    const userJobs = [];
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.userId === userId && new Date(job.startTime) >= dateFilter) {
        userJobs.push(job);
      }
    }
    
    // Calculate status breakdown
    const statusBreakdown = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };
    
    let totalProducts = 0;
    let totalBrands = 0;
    let totalProcessingTime = 0;
    let completedJobs = 0;
    
    userJobs.forEach(job => {
      statusBreakdown[job.status] = (statusBreakdown[job.status] || 0) + 1;
      totalProducts += job.products ? job.products.length : 0;
      totalBrands += job.totalBrands || 0;
      
      if (job.endTime && job.startTime) {
        totalProcessingTime += (new Date(job.endTime) - new Date(job.startTime));
        completedJobs++;
      }
    });
    
    return {
      period,
      statusBreakdown,
      totals: {
        totalJobs: userJobs.length,
        totalProducts,
        totalBrands,
        avgProcessingTime: completedJobs > 0 ? totalProcessingTime / completedJobs : 0
      }
    };
  }

  /**
   * Delete a completed job
   * @param {string} jobId - Job ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  deleteJob(jobId, userId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job || job.userId !== userId) {
      return false;
    }
    
    // Only allow deletion of completed, failed, or cancelled jobs
    if (!['completed', 'failed', 'cancelled'].includes(job.status)) {
      throw new Error('Cannot delete active job');
    }
    
    this.activeJobs.delete(jobId);
    console.log(`🗑️ Job ${jobId} deleted by user ${userId}`);
    
    return true;
  }

  /**
   * Schedule a retry for a failed brand
   * @param {string} jobId - Job ID
   * @param {Object} brandResult - Failed brand result
   * @param {number} retryCount - Current retry count
   */
  async scheduleRetry(jobId, brandResult, retryCount) {
    try {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000); // Exponential backoff, max 30s
      
      setTimeout(async () => {
        const brandJob = {
          jobId,
          brandName: brandResult.brandName,
          brandUrl: brandResult.brandUrl,
          storeId: brandResult.storeId,
          userId: brandResult.userId,
          retryCount,
          isRetry: true,
          createdAt: new Date()
        };
        
        await simpleQueue.addJob('bulk_fetch_queue', brandJob);
        console.log(`🔄 Scheduled retry for brand ${brandResult.brandName} (attempt ${retryCount})`);
      }, retryDelay);
    } catch (error) {
      console.error(`❌ Failed to schedule retry for brand ${brandResult.brandName}:`, error);
    }
  }

  /**
   * Cancel a job
   * @param {string} jobId - Job ID
   * @returns {boolean} Success status
   */
  cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      return false;
    }

    job.status = 'cancelled';
    job.endTime = new Date();
    job.cancellationReason = 'User requested cancellation';
    this.activeJobs.set(jobId, job);
    
    // Emit job cancellation via WebSocket
    socketManager.emitJobCancelled(jobId, {
      status: 'cancelled',
      processedBrands: job.processedBrands,
      totalBrands: job.totalBrands,
      reason: job.cancellationReason
    });
    
    console.log(`🛑 Job ${jobId} cancelled`);
    return true;
  }

  /**
   * Clean up completed jobs older than specified time
   * @param {number} maxAgeHours - Maximum age in hours
   */
  cleanupOldJobs(maxAgeHours = 24) {
    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
    let cleanedCount = 0;

    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.status === 'completed' && job.endTime && job.endTime < cutoffTime) {
        this.activeJobs.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old jobs`);
    }
  }
}

// Singleton instance
const bulkFetchService = new BulkFetchService();

// Clean up old jobs every hour
setInterval(() => {
  bulkFetchService.cleanupOldJobs();
}, 60 * 60 * 1000);

module.exports = bulkFetchService;