import React from 'react';
import { X, Eye, Square } from 'lucide-react';
import { useBulkFetch } from '../contexts/BulkFetchContext';
import { Button } from '@/components/ui/button';

const BulkFetchToast = () => {
  const { 
    isActive, 
    progress, 
    currentBrand, 
    fetchedProducts,
    stopBulkFetch,
    openModal 
  } = useBulkFetch();

  if (!isActive) return null;

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[320px] max-w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <h3 className="font-semibold text-gray-900 text-sm">
              Bütün məhsullar çəkilir
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopBulkFetch}
            className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>{progress.current}/{progress.total} marka</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span>Çəkilən məhsul sayı: {fetchedProducts.length}</span>
          <span>Qalan brend sayı: {progress.total - progress.current}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openModal}
            className="flex-1 h-8 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Detallara bax
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={stopBulkFetch}
            className="h-8 text-xs px-3"
          >
            <X className="h-3 w-3 mr-1" />
            Ləğv et
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkFetchToast;