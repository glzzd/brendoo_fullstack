const EventEmitter = require('events');

class SimpleQueue extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.workers = new Map();
    this.isProcessing = false;
  }

  // Create or get a queue
  getQueue(queueName) {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    return this.queues.get(queueName);
  }

  // Add job to queue
  async publishJob(queueName, jobData) {
    try {
      const queue = this.getQueue(queueName);
      const job = {
        id: Date.now() + Math.random(),
        data: jobData,
        timestamp: new Date(),
        retries: 0,
        maxRetries: 3
      };
      
      queue.push(job);
      console.log(`📦 Job added to queue ${queueName}:`, job.id);
      
      // Process queue if worker is available
      this.processQueue(queueName);
      
      return job.id;
    } catch (error) {
      console.error('Error publishing job:', error);
      throw error;
    }
  }

  // Register worker for a queue
  async consumeJobs(queueName, callback) {
    this.workers.set(queueName, callback);
    console.log(`👷 Worker registered for queue: ${queueName}`);
    
    // Start processing existing jobs
    this.processQueue(queueName);
  }

  // Process jobs in queue
  async processQueue(queueName) {
    if (this.isProcessing) return;
    
    const queue = this.getQueue(queueName);
    const worker = this.workers.get(queueName);
    
    if (!worker || queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (queue.length > 0) {
      const job = queue.shift();
      
      try {
        console.log(`🔄 Processing job ${job.id} from queue ${queueName}`);
        await worker(job.data);
        console.log(`✅ Job ${job.id} completed successfully`);
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error.message);
        
        // Retry logic
        job.retries++;
        if (job.retries < job.maxRetries) {
          console.log(`🔄 Retrying job ${job.id} (attempt ${job.retries + 1}/${job.maxRetries})`);
          queue.push(job); // Add back to queue for retry
        } else {
          console.error(`💀 Job ${job.id} failed permanently after ${job.maxRetries} attempts`);
          this.emit('job-failed', { job, error });
        }
      }
      
      // Small delay between jobs
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isProcessing = false;
  }

  // Get queue status
  getQueueStatus(queueName) {
    const queue = this.getQueue(queueName);
    return {
      name: queueName,
      length: queue.length,
      hasWorker: this.workers.has(queueName),
      isProcessing: this.isProcessing
    };
  }

  // Clear queue
  clearQueue(queueName) {
    this.queues.set(queueName, []);
    console.log(`🗑️ Queue ${queueName} cleared`);
  }

  // Get all queues status
  getAllQueuesStatus() {
    const status = {};
    for (const queueName of this.queues.keys()) {
      status[queueName] = this.getQueueStatus(queueName);
    }
    return status;
  }

  // Connect method for compatibility
  async connect() {
    console.log('🔗 Simple Queue system initialized');
    return Promise.resolve();
  }

  // Close method for compatibility
  async close() {
    this.queues.clear();
    this.workers.clear();
    console.log('🔌 Simple Queue system closed');
  }

  // Check if connected
  isConnectionActive() {
    return true;
  }
}

// Singleton instance
const simpleQueue = new SimpleQueue();

module.exports = simpleQueue;