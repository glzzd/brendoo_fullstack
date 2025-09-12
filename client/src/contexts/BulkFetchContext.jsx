import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { apiClient } from '../api';

const BulkFetchContext = createContext();

export const useBulkFetch = () => {
  const context = useContext(BulkFetchContext);
  if (!context) {
    throw new Error('useBulkFetch must be used within a BulkFetchProvider');
  }
  return context;
};

export const BulkFetchProvider = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [processedBrands, setProcessedBrands] = useState([]);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [storeId, setStoreId] = useState(null);

  const { subscribeToJob, unsubscribeFromJob, getJobProgress, clearJobProgress, isConnected } = useSocket();
  const { token } = useAuth();

  // Clear all state
  const clearState = useCallback(() => {
    setIsActive(false);
    setProgress({ current: 0, total: 0 });
    setFetchedProducts([]);
    setProcessedBrands([]);
    setCurrentBrand(null);
    setCurrentJobId(null);
    setJobStatus(null);
  }, []);

  // Clear state when socket disconnects (server restart)
  useEffect(() => {
    if (!isConnected && currentJobId) {
      console.log('🔌 Socket disconnected, clearing bulk fetch state');
      clearState();
      toast.info('Connection lost, bulk fetch reset');
    }
  }, [isConnected, currentJobId, clearState]);

  // Start bulk fetch with RabbitMQ
  const startBulkFetch = useCallback(async (brands, selectedStoreId) => {
    if (isActive) {
      toast.error('Bulk fetch is already running');
      return;
    }

    try {
      // Clear previous state
      clearState();
      
      setStoreId(selectedStoreId);
      setIsActive(true);
      setProgress({ current: 0, total: Object.keys(brands).length });
      
      toast.loading('Starting bulk fetch job...', { id: 'bulk-fetch-start' });

      // Start bulk fetch job via API
      const response = await apiClient.post('/bulk-fetch/start', {
        brands,
        storeId: selectedStoreId
      }, token);

      const { jobId, totalBrands } = response.data;
      
      setCurrentJobId(jobId);
      setProgress({ current: 0, total: totalBrands });
      
      // Subscribe to job updates via WebSocket
      subscribeToJob(jobId);
      
      toast.success(`Bulk fetch job started! Processing ${totalBrands} brands`, { id: 'bulk-fetch-start' });
      
    } catch (error) {
      console.error('Error starting bulk fetch:', error);
      toast.error(error.response?.data?.message || 'Failed to start bulk fetch', { id: 'bulk-fetch-start' });
      clearState();
    }
  }, [isActive, token, subscribeToJob, clearState]);

  // Start bulk fetch for all brands
  const startAllBrandsFetch = useCallback(async (selectedStoreId) => {
    if (isActive) {
      toast.error('Bulk fetch is already running');
      return;
    }

    try {
      // Clear previous state
      clearState();
      
      setStoreId(selectedStoreId);
      setIsActive(true);
      
      toast.loading('Fetching all brands and starting bulk fetch...', { id: 'bulk-fetch-start' });

      // Start bulk fetch for all brands via API
      const response = await apiClient.post('/bulk-fetch/start-all-brands', {
        storeId: selectedStoreId
      }, token);

      const { jobId, totalBrands } = response.data;
      
      setCurrentJobId(jobId);
      setProgress({ current: 0, total: totalBrands });
      
      // Subscribe to job updates via WebSocket
      subscribeToJob(jobId);
      
      toast.success(`Bulk fetch started for all ${totalBrands} brands!`, { id: 'bulk-fetch-start' });
      
    } catch (error) {
      console.error('Error starting all brands fetch:', error);
      toast.error(error.response?.data?.message || 'Failed to start all brands fetch', { id: 'bulk-fetch-start' });
      clearState();
    }
  }, [isActive, token, subscribeToJob, clearState]);

  // Stop bulk fetch
  const stopBulkFetch = useCallback(async () => {
    if (!isActive || !currentJobId) {
      return;
    }

    try {
      // Cancel the job via API
      await apiClient.put(`/bulk-fetch/cancel/${currentJobId}`, {}, token);

      // Unsubscribe from job updates
      unsubscribeFromJob(currentJobId);
      clearJobProgress(currentJobId);
      
      // Clear state completely
      clearState();
      
      toast.success('Bulk fetch stopped and state cleared');
      
    } catch (error) {
      console.error('Error stopping bulk fetch:', error);
      toast.error('Failed to stop bulk fetch');
    }
  }, [isActive, currentJobId, token, unsubscribeFromJob, clearJobProgress, clearState]);

  // Get job status
  const getJobStatusFromAPI = useCallback(async (jobId) => {
    if (!jobId || !token) return null;

    try {
      const response = await api.get(`/bulk-fetch/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting job status:', error);
      return null;
    }
  }, [token]);

  // Listen to WebSocket job progress updates
  useEffect(() => {
    if (!currentJobId) return;

    const jobProgress = getJobProgress(currentJobId);
    if (!jobProgress) return;

    console.log('Job progress update:', jobProgress);

    switch (jobProgress.type) {
      case 'progress':
        // Update progress for individual brand completion
        setProgress(prev => ({
          ...prev,
          current: jobProgress.brandIndex + 1
        }));
        
        setCurrentBrand(jobProgress.brandName);
        
        // Add to processed brands
        setProcessedBrands(prev => {
          const exists = prev.find(b => b.name === jobProgress.brandName);
          if (!exists) {
            return [...prev, {
              name: jobProgress.brandName,
              status: jobProgress.status,
              productCount: jobProgress.products?.length || 0,
              error: jobProgress.error || null
            }];
          }
          return prev;
        });
        
        // Add products if successful
        if (jobProgress.products && jobProgress.products.length > 0) {
          setFetchedProducts(prev => [...prev, ...jobProgress.products]);
        }
        break;

      case 'error':
        // Handle individual brand error
        setProcessedBrands(prev => {
          const exists = prev.find(b => b.name === jobProgress.brandName);
          if (!exists) {
            return [...prev, {
              name: jobProgress.brandName,
              status: 'failed',
              productCount: 0,
              error: jobProgress.error
            }];
          }
          return prev;
        });
        
        setProgress(prev => ({
          ...prev,
          current: jobProgress.brandIndex + 1
        }));
        break;

      case 'complete':
        // Job completed
        setIsActive(false);
        setCurrentBrand(null);
        setJobStatus('completed');
        
        // Final progress update
        setProgress(prev => ({
          ...prev,
          current: prev.total
        }));
        
        // Unsubscribe from job updates
        unsubscribeFromJob(currentJobId);
        break;

      case 'cancelled':
        // Job cancelled
        clearState();
        break;

      default:
        break;
    }
  }, [currentJobId, getJobProgress, unsubscribeFromJob, clearState]);

  // Reset function
  const resetBulkFetch = useCallback(() => {
    if (currentJobId) {
      unsubscribeFromJob(currentJobId);
      clearJobProgress(currentJobId);
    }
    clearState();
    toast.success('Bulk fetch reset');
  }, [currentJobId, unsubscribeFromJob, clearJobProgress, clearState]);

  // Open modal
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Get user jobs
  const getUserJobs = useCallback(async () => {
    if (!token) return [];

    try {
      const response = await api.get('/bulk-fetch/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting user jobs:', error);
      return [];
    }
  }, [token]);

  const value = {
    // State
    isActive,
    progress,
    fetchedProducts,
    processedBrands,
    currentBrand,
    isModalOpen,
    currentJobId,
    jobStatus,
    storeId,
    
    // Actions
    startBulkFetch,
    startAllBrandsFetch,
    stopBulkFetch,
    resetBulkFetch,
    openModal,
    closeModal,
    getJobStatusFromAPI,
    getUserJobs,
    
    // Computed values
    hasProducts: fetchedProducts.length > 0,
    completedBrands: processedBrands.filter(b => b.status === 'completed').length,
    failedBrands: processedBrands.filter(b => b.status === 'failed').length,
    totalProducts: fetchedProducts.length
  };

  return (
    <BulkFetchContext.Provider value={value}>
      {children}
    </BulkFetchContext.Provider>
  );
};

export default BulkFetchContext;