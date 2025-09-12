import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [jobProgress, setJobProgress] = useState({});
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const socketUrl = apiUrl.replace('/api', ''); // Remove /api suffix for socket connection
      const newSocket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
        setIsConnected(true);
        toast.success('Real-time connection established');
      });

      newSocket.on('connected', (data) => {
        console.log('📡 WebSocket connection confirmed:', data);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from WebSocket server:', reason);
        setIsConnected(false);
        if (reason !== 'io client disconnect') {
          toast.error('Real-time connection lost');
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setIsConnected(false);
        toast.error('Failed to establish real-time connection');
      });

      // Job progress event handlers
      newSocket.on('job_progress', (data) => {
        console.log('📊 Job progress update:', data);
        setJobProgress(prev => ({
          ...prev,
          [data.jobId]: {
            ...prev[data.jobId],
            ...data,
            type: 'progress'
          }
        }));
      });

      newSocket.on('job_complete', (data) => {
        console.log('✅ Job completed:', data);
        setJobProgress(prev => ({
          ...prev,
          [data.jobId]: {
            ...prev[data.jobId],
            ...data,
            type: 'complete'
          }
        }));
        toast.success(`Bulk fetch completed! ${data.totalProducts} products found`);
      });

      newSocket.on('job_error', (data) => {
        console.log('❌ Job error:', data);
        setJobProgress(prev => ({
          ...prev,
          [data.jobId]: {
            ...prev[data.jobId],
            ...data,
            type: 'error'
          }
        }));
      });

      newSocket.on('job_cancelled', (data) => {
        console.log('🛑 Job cancelled:', data);
        setJobProgress(prev => ({
          ...prev,
          [data.jobId]: {
            ...prev[data.jobId],
            ...data,
            type: 'cancelled'
          }
        }));
        toast.info('Bulk fetch job cancelled');
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Cleaning up WebSocket connection');
        newSocket.disconnect();
      };
    } else {
      // Clean up socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setJobProgress({});
      }
    }
  }, [user, token]);

  // Subscribe to job updates
  const subscribeToJob = (jobId) => {
    if (socket && isConnected) {
      console.log(`📡 Subscribing to job ${jobId}`);
      socket.emit('subscribe_job', jobId);
    }
  };

  // Unsubscribe from job updates
  const unsubscribeFromJob = (jobId) => {
    if (socket && isConnected) {
      console.log(`📡 Unsubscribing from job ${jobId}`);
      socket.emit('unsubscribe_job', jobId);
    }
  };

  // Get job progress data
  const getJobProgress = (jobId) => {
    return jobProgress[jobId] || null;
  };

  // Clear job progress data
  const clearJobProgress = (jobId) => {
    setJobProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[jobId];
      return newProgress;
    });
  };

  // Clear all job progress data
  const clearAllJobProgress = () => {
    setJobProgress({});
  };

  const value = {
    socket,
    isConnected,
    jobProgress,
    subscribeToJob,
    unsubscribeFromJob,
    getJobProgress,
    clearJobProgress,
    clearAllJobProgress
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;