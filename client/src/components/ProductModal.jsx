import React, { useState } from 'react';
import { X, Package, ExternalLink, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, brandName, brandUrl, products, loading, error }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBrandClick = () => {
    if (brandUrl) {
      window.open(brandUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {brandName} Məhsulları {products && products.length > 0 && `(${products.length} məhsul)`}
              </h2>
              {brandUrl && (
                <button
                  onClick={handleBrandClick}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>Brendin səhifəsinə keç</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Məhsullar yüklənir...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Məhsullar yüklənərkən xəta baş verdi</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && products && products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Bu brend üçün məhsul tapılmadı</p>
            </div>
          )}

          {!loading && !error && products && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ProductCard Component with Image Slider
const ProductCard = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Combine main image with additional images
  const allImages = [];
  if (product.image) allImages.push(product.image);
  if (product.additionalImages && Array.isArray(product.additionalImages)) {
    // Clean up image URLs by removing backticks and extra spaces
    const cleanedImages = product.additionalImages.map(img => 
      img.toString().replace(/[`"']/g, '').trim()
    ).filter(img => img && img.length > 0);
    allImages.push(...cleanedImages);
  }
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };
  
  const formatPrice = (price) => {
    if (!price) return null;
    // Remove existing currency symbols and add AZN
    const cleanPrice = price.toString().replace(/[₼$€£]/g, '').trim();
    return `${cleanPrice} AZN`;
  };
  
  const renderSizes = (sizes) => {
    if (!sizes || !Array.isArray(sizes)) return null;
    
    // Sort sizes from largest to smallest (numerical sort)
    const sortedSizes = [...sizes].sort((a, b) => {
      const sizeA = parseFloat(a.sizeName || a.size || 0);
      const sizeB = parseFloat(b.sizeName || b.size || 0);
      return sizeB - sizeA; // Descending order (largest to smallest)
    });
    
    return (
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Ölçülər:</h4>
        <div className="flex flex-wrap gap-2">
          {sortedSizes.map((size, index) => {
            // Handle both old format (size.stock) and new format (size.isAvailable)
            const isAvailable = size.isAvailable !== undefined ? size.isAvailable : (size.stock > 0);
            const sizeName = size.sizeName || size.size;
            const stockInfo = size.stock !== undefined ? size.stock : null;
            
            return (
              <div
                key={index}
                className={`px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1 ${
                  isAvailable 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                <span>{sizeName}</span>
                {isAvailable ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                <span className="text-xs">
                  ({isAvailable ? 
                    (stockInfo !== null ? `${stockInfo} ədəd` : 'Stokda var') : 
                    'Yoxdur'
                  })
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Image Slider */}
      {allImages.length > 0 && (
        <div className="relative group">
          <div className="aspect-w-16 aspect-h-12 bg-gray-100">
            <img 
              src={allImages[currentImageIndex]} 
              alt={product.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
              }}
            />
          </div>
          
          {/* Image Navigation */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
              
              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
          {product.name || 'Məhsul adı yoxdur'}
        </h3>
        
        {/* Price */}
        {product.price && (
          <div className="mb-3">
            <p className="text-lg font-bold text-blue-600">
              {formatPrice(product.price)}
            </p>
          </div>
        )}
        
        {/* Sizes */}
        {renderSizes(product.sizes)}
        
        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}
        
        {/* Action Button */}
        {product.url && (
          <button
            onClick={() => window.open(product.url, '_blank', 'noopener,noreferrer')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>Məhsula bax</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductModal;