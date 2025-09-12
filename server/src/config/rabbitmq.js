const amqp = require('amqplib');

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    
    this.queues = {
      BULK_FETCH: 'bulk_fetch_queue',
      DEAD_LETTER: 'dead_letter_queue',
      RETRY: 'retry_queue'
    };
    
    this.exchanges = {
      DEAD_LETTER: 'dead_letter_exchange'
    };
  }

  async connect() {
    try {
      console.log('🐰 Connecting to RabbitMQ...');
      
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Enable publisher confirms for reliability
      await this.channel.confirmChannel();
      
      // Setup queues with error handling
      await this.setupQueues();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ RabbitMQ connected successfully');
      
      // Handle connection events
      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err);
        this.isConnected = false;
        this.handleReconnection();
      });
      
      this.connection.on('close', () => {
        console.log('🔌 RabbitMQ connection closed');
        this.isConnected = false;
        this.handleReconnection();
      });
      
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      this.handleReconnection();
    }
  }

  async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection.`);
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    
    console.log(`🔄 Attempting to reconnect to RabbitMQ (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    setTimeout(() => this.connect(), delay);
  }

  async setupQueues() {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      // Dead letter exchange for failed messages
      await this.channel.assertExchange(this.exchanges.DEAD_LETTER, 'direct', {
        durable: true
      });
      
      // Dead letter queue
      await this.channel.assertQueue(this.queues.DEAD_LETTER, {
        durable: true
      });
      
      // Bind dead letter queue to dead letter exchange
      await this.channel.bindQueue(
        this.queues.DEAD_LETTER,
        this.exchanges.DEAD_LETTER,
        'failed'
      );
      
      // Main bulk fetch queue with dead letter configuration
      await this.channel.assertQueue(this.queues.BULK_FETCH, {
        durable: true,
        arguments: {
          'x-message-ttl': 3600000, // 1 hour TTL
          'x-max-retries': 3,
          'x-dead-letter-exchange': this.exchanges.DEAD_LETTER,
          'x-dead-letter-routing-key': 'failed'
        }
      });
      
      // Retry queue for failed jobs
      await this.channel.assertQueue(this.queues.RETRY, {
        durable: true,
        arguments: {
          'x-message-ttl': 300000, // 5 minutes delay
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': this.queues.BULK_FETCH
        }
      });
      
      console.log('✅ RabbitMQ queues and dead letter setup completed');
    } catch (error) {
      console.error('❌ Error setting up queues:', error);
      throw error;
    }
  }

  async publishJob(jobData, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error('RabbitMQ not connected');
      }
      
      const { retryCount = 0, priority = 0 } = options;
      const message = Buffer.from(JSON.stringify({
        ...jobData,
        retryCount,
        originalTimestamp: jobData.originalTimestamp || Date.now()
      }));
      
      const published = await this.channel.sendToQueue(
        this.queues.BULK_FETCH,
        message,
        {
          persistent: true,
          messageId: jobData.jobId,
          timestamp: Date.now(),
          priority,
          headers: {
            'x-retry-count': retryCount,
            'x-original-queue': this.queues.BULK_FETCH
          }
        }
      );
      
      if (published) {
        console.log(`📤 Job ${jobData.jobId} published to queue (retry: ${retryCount})`);
        return true;
      } else {
        throw new Error('Failed to publish job to queue');
      }
    } catch (error) {
      console.error('❌ Error publishing job:', error);
      throw error;
    }
  }
  
  async publishToRetryQueue(jobData, delay = 300000) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error('RabbitMQ not connected');
      }
      
      const message = Buffer.from(JSON.stringify(jobData));
      
      const published = await this.channel.sendToQueue(
        this.queues.RETRY,
        message,
        {
          persistent: true,
          messageId: jobData.jobId,
          timestamp: Date.now(),
          expiration: delay.toString()
        }
      );
      
      if (published) {
        console.log(`🔄 Job ${jobData.jobId} sent to retry queue with ${delay}ms delay`);
        return true;
      } else {
        throw new Error('Failed to publish job to retry queue');
      }
    } catch (error) {
      console.error('❌ Error publishing to retry queue:', error);
      throw error;
    }
  }
  
  async publishToDeadLetter(jobData, reason) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error('RabbitMQ not connected');
      }
      
      const message = Buffer.from(JSON.stringify({
        ...jobData,
        failureReason: reason,
        failedAt: new Date().toISOString()
      }));
      
      const published = await this.channel.publish(
        this.exchanges.DEAD_LETTER,
        'failed',
        message,
        {
          persistent: true,
          messageId: jobData.jobId,
          timestamp: Date.now()
        }
      );
      
      if (published) {
        console.log(`💀 Job ${jobData.jobId} sent to dead letter queue: ${reason}`);
        return true;
      } else {
        throw new Error('Failed to publish job to dead letter queue');
      }
    } catch (error) {
      console.error('❌ Error publishing to dead letter queue:', error);
      throw error;
    }
  }

  async consumeJobs(queueName, callback) {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    // Set prefetch to 1 to ensure fair distribution
    await this.channel.prefetch(1);

    return this.channel.consume(queueName, async (message) => {
      if (message) {
        try {
          const jobData = JSON.parse(message.content.toString());
          await callback(jobData, message);
          
          // Acknowledge the message
          this.channel.ack(message);
        } catch (error) {
          console.error('❌ Error processing job:', error);
          
          // Reject and requeue the message (will go to DLQ after max retries)
          this.channel.nack(message, false, false);
        }
      }
    });
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log('🔌 RabbitMQ connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }

  getChannel() {
    return this.channel;
  }

  isConnectionActive() {
    return this.isConnected;
  }
}

// Singleton instance
const rabbitmq = new RabbitMQConnection();

module.exports = rabbitmq;