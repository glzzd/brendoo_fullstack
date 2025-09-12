const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 User ${socket.user.email} connected (${socket.id})`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Handle bulk fetch job subscription
      socket.on('subscribe_job', (jobId) => {
        console.log(`📡 User ${socket.user.email} subscribed to job ${jobId}`);
        socket.join(`job_${jobId}`);
      });

      // Handle bulk fetch job unsubscription
      socket.on('unsubscribe_job', (jobId) => {
        console.log(`📡 User ${socket.user.email} unsubscribed from job ${jobId}`);
        socket.leave(`job_${jobId}`);
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`🔌 User ${socket.user.email} disconnected (${reason})`);
        this.connectedUsers.delete(socket.userId);
      });

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Successfully connected to WebSocket',
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    console.log('✅ Socket.IO initialized successfully');
    return this.io;
  }

  // Emit progress update to specific job subscribers
  emitJobProgress(jobId, progressData) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized');
      return;
    }

    this.io.to(`job_${jobId}`).emit('job_progress', {
      jobId,
      ...progressData,
      timestamp: new Date()
    });

    console.log(`📊 Emitted progress for job ${jobId}:`, {
      brand: progressData.brandName,
      progress: `${progressData.brandIndex + 1}/${progressData.totalBrands}`,
      status: progressData.status
    });
  }

  // Emit job completion to specific job subscribers
  emitJobComplete(jobId, jobData) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized');
      return;
    }

    this.io.to(`job_${jobId}`).emit('job_complete', {
      jobId,
      ...jobData,
      timestamp: new Date()
    });

    console.log(`✅ Emitted completion for job ${jobId}`);
  }

  // Emit job error to specific job subscribers
  emitJobError(jobId, errorData) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized');
      return;
    }

    this.io.to(`job_${jobId}`).emit('job_error', {
      jobId,
      ...errorData,
      timestamp: new Date()
    });

    console.log(`❌ Emitted error for job ${jobId}:`, errorData.error);
  }

  // Emit job cancellation to specific job subscribers
  emitJobCancelled(jobId, jobData) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized');
      return;
    }

    this.io.to(`job_${jobId}`).emit('job_cancelled', {
      jobId,
      ...jobData,
      timestamp: new Date()
    });

    console.log(`🛑 Emitted cancellation for job ${jobId}`);
  }

  // Send message to specific user
  emitToUser(userId, event, data) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized');
      return;
    }

    this.io.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (!this.io) {
      console.warn('⚠️ Socket.IO not initialized');
      return;
    }

    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get socket instance
  getIO() {
    return this.io;
  }
}

// Singleton instance
const socketManager = new SocketManager();

module.exports = socketManager;