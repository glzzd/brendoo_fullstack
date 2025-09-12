import React, { useState } from 'react';
import { X, Download, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { useBulkFetch } from '../contexts/BulkFetchContext';
import { Button } from '@/components/ui/button';

const BulkFetchModal = () => {
  const { 
    isModalOpen, 
    closeModal, 
    processedBrands, 
    fetchedProducts,
    progress,
    isActive,
    stopBulkFetch,
    resetBulkFetch,
    saveProductsToJSON
  } = useBulkFetch();

  const [activeTab, setActiveTab] = useState('overview');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full font-medium";
    switch (status) {
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Tamamlandı
          </span>
        );
      case 'error':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Hata</span>;
      case 'processing':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>İşleniyor</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Bekliyor</span>;
    }
  };

  const handleDownloadJSON = () => {
    if (fetchedProducts.length > 0) {
      saveProductsToJSON(fetchedProducts);
    }
  };

  const handleStop = () => {
    stopBulkFetch();
    closeModal();
  };

  const handleReset = () => {
    resetBulkFetch();
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold">Toplu Ürün Çekme İşlemi</h2>
            <div className="flex items-center gap-2">
              {progress.total > 0 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                  {progress.current}/{progress.total}
                </span>
              )}
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Progress Bar */}
          {progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>İlerleme</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {processedBrands.length}
              </div>
              <div className="text-sm text-gray-600">İşlenen Marka</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {fetchedProducts.length}
              </div>
              <div className="text-sm text-gray-600">Çekilen Ürün</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {processedBrands.filter(b => b.status === 'error').length}
              </div>
              <div className="text-sm text-gray-600">Hata</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="w-full">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                Genel Bakış
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'brands'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('brands')}
              >
                Markalar
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('products')}
              >
                Ürünler
              </button>
            </div>

            <div className="mt-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Son İşlenen Markalar</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {processedBrands.slice(-5).map((brand, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(brand.status)}
                          <span className="font-medium">{brand.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {brand.productCount || 0} ürün
                          </span>
                          {getStatusBadge(brand.status)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="font-semibold">Son Çekilen Ürünler</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {fetchedProducts.slice(-5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium truncate">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {product.brand}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            ₺{product.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'brands' && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {processedBrands.map((brand, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(brand.status)}
                        <div>
                          <div className="font-medium">{brand.name}</div>
                          <div className="text-sm text-gray-600">
                            {brand.productCount || 0} ürün çekildi
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(brand.status)}
                        {brand.error && (
                          <span className="text-xs text-red-600 max-w-xs truncate">
                            {brand.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'products' && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {fetchedProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium truncate max-w-xs">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {product.brand} • {product.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          ₺{product.price}
                        </span>
                        {product.stock !== undefined && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            product.stock > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            Stok: {product.stock}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          <div className="flex gap-2">
            {isActive && (
              <Button variant="destructive" onClick={handleStop}>
                Durdur
              </Button>
            )}
            {!isActive && (fetchedProducts.length > 0 || processedBrands.length > 0) && (
              <Button variant="outline" onClick={handleReset}>
                Sıfırla
              </Button>
            )}
            {fetchedProducts.length > 0 && (
              <Button variant="outline" onClick={handleDownloadJSON}>
                <Download className="w-4 h-4 mr-2" />
                JSON İndir
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={closeModal}>
            <X className="w-4 h-4 mr-2" />
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkFetchModal;