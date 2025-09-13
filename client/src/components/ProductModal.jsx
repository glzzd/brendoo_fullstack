import React, { useState } from 'react';
import { X, Package, ExternalLink, ChevronLeft, ChevronRight, Check, AlertCircle, DollarSign } from 'lucide-react';

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
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
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
        <div className="p-6 overflow-y-auto flex-1">
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

// ProductCard Component with Enhanced Image Slider
const ProductCard = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Combine main image with additional images
  const allImages = [];
  if (product.image) allImages.push(product.image);
  if (product.additionalImages && Array.isArray(product.additionalImages)) {
    // Clean up image URLs by removing backticks and extra spaces
    const cleanedImages = product.additionalImages.map(img => 
      img.toString().replace(/[`"']/g, '').trim()
    ).filter(img => img && img.length > 0 && img !== product.image); // Avoid duplicates
    allImages.push(...cleanedImages);
  }
  
  // Remove duplicates
  const uniqueImages = [...new Set(allImages)];
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % uniqueImages.length);
    setIsImageLoading(true);
    setImageError(false);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + uniqueImages.length) % uniqueImages.length);
    setIsImageLoading(true);
    setImageError(false);
  };
  
  const goToImage = (index) => {
    setCurrentImageIndex(index);
    setIsImageLoading(true);
    setImageError(false);
  };
  
  const handleImageLoad = () => {
    setIsImageLoading(false);
  };
  
  const handleImageError = (e) => {
    setIsImageLoading(false);
    setImageError(true);
    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
  };
  
  const formatPrice = (price) => {
    if (!price) return null;
    // Remove existing currency symbols and add AZN
    const cleanPrice = price.toString().replace(/[₼$€£]/g, '').trim();
    return `${cleanPrice} AZN`;
  };
  
  const renderSizes = (sizes) => {
    if (!sizes || !Array.isArray(sizes)) return null;
    
    // Custom sorting function for sizes
    const sortedSizes = [...sizes].sort((a, b) => {
      const sizeA = a.sizeName || a.size || '';
      const sizeB = b.sizeName || b.size || '';
      
      // Define size order for text sizes
      const textSizeOrder = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, 'XXXL': 7 };
      
      // Check if both are text sizes
      if (textSizeOrder[sizeA] && textSizeOrder[sizeB]) {
        return textSizeOrder[sizeA] - textSizeOrder[sizeB];
      }
      
      // Check if both are numeric
      const numA = parseFloat(sizeA);
      const numB = parseFloat(sizeB);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB; // Ascending order for numbers
      }
      
      // Mixed types: text sizes come first, then numbers
      if (textSizeOrder[sizeA] && !isNaN(numB)) return -1;
      if (textSizeOrder[sizeB] && !isNaN(numA)) return 1;
      
      // Default string comparison
      return sizeA.localeCompare(sizeB);
    });
    
    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ölçülər
          </span>
          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {sortedSizes.length}
          </span>
        </h4>
        <div className="space-y-1 overflow-y-auto">
          {sortedSizes.map((size, index) => {
            // Handle both old format (size.stock) and new format (size.isAvailable)
            const isAvailable = size.isAvailable !== undefined ? size.isAvailable : (size.stock > 0);
            const sizeName = size.sizeName || size.size;
            const stockInfo = size.stock !== undefined ? size.stock : null;
            
            return (
              <div
                key={index}
                className={`relative p-2 rounded-xl border-2 transition-all duration-300  hover:shadow-md group ${
                  isAvailable 
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300' 
                    : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${
                      isAvailable ? 'text-emerald-700' : 'text-gray-500'
                    }`}>
                      {sizeName}
                    </span>
                    <div className={`p-1 rounded-full ${
                      isAvailable 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isAvailable ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`text-xs font-medium ${
                      isAvailable ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      {isAvailable ? 
                        (stockInfo !== null ? (
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              stockInfo > 5 ? 'bg-green-400' : stockInfo > 2 ? 'bg-yellow-400' : 'bg-orange-400'
                            }`}></div>
                            <span>Stok: {stockInfo}</span>
                          </div>
                        ) : 'Stokda var') : 
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span>Yoxdur</span>
                        </div>
                      }
                    </div>
                    
                    {size.barcode && (
                      <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded border">
                        {size.barcode}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Hover Effect Overlay */}
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                  isAvailable 
                    ? 'bg-gradient-to-r from-emerald-400/5 to-green-400/5' 
                    : 'bg-gradient-to-r from-gray-400/5 to-slate-400/5'
                }`}></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group h-[600px] flex flex-col">
      {/* HEADER - Image Slider */}
      {uniqueImages.length > 0 && (
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-100">
          <div className="aspect-w-16 aspect-h-12 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
            {/* Loading Spinner */}
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            <img 
              src={uniqueImages[currentImageIndex]} 
              alt={product.name}
              className={`w-full h-48 object-cover transition-all duration-500 ${
                isImageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
              } hover:scale-105`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            {/* Image Counter */}
            {uniqueImages.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {currentImageIndex + 1} / {uniqueImages.length}
              </div>
            )}
          </div>
          
          {/* Enhanced Image Navigation */}
          {uniqueImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
              
              {/* Enhanced Image Indicators */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {uniqueImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentImageIndex 
                        ? 'w-8 h-2 bg-white shadow-lg' 
                        : 'w-2 h-2 bg-white/60 hover:bg-white/80 hover:scale-125'
                    }`}
                  />
                ))}
              </div>
              
              {/* Thumbnail Preview (for more than 3 images) */}
              {uniqueImages.length > 3 && (
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex space-x-1">
                    {uniqueImages.slice(0, 4).map((img, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-8 h-8 rounded border-2 overflow-hidden transition-all duration-200 ${
                          index === currentImageIndex 
                            ? 'border-white shadow-lg scale-110' 
                            : 'border-white/50 hover:border-white hover:scale-105'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/32x32?text=?';
                          }}
                        />
                      </button>
                    ))}
                    {uniqueImages.length > 4 && (
                      <div className="w-8 h-8 rounded border-2 border-white/50 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">+{uniqueImages.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* TITLE - Product Name & Price */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 line-clamp-2 text-xs flex-1">
            {product.name || 'Məhsul adı yoxdur'}
          </h3>
          
          {/* Price */}
          {(product.price || (product.sizes && product.sizes.length > 0 && product.sizes[0].price)) && (
            <div className="flex-shrink-0">
              {(() => {
                const mainPrice = product.price || (product.sizes && product.sizes[0] && product.sizes[0].price);
                const discountPrice = product.discountedPrice || (product.sizes && product.sizes[0] && product.sizes[0].discountedPrice);
                
                if (discountPrice && discountPrice > 0) {
                  return (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 line-through">
                        {formatPrice(mainPrice)}
                      </p>
                      <p className="text-sm font-bold text-red-600">
                        {formatPrice(discountPrice)}
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <p className="text-sm font-bold text-blue-600">
                      {formatPrice(mainPrice)}
                    </p>
                  );
                }
              })()
              }
            </div>
          )}
        </div>
      </div>
      
      {/* BODY - Sizes Only */}
      <div className="flex-1 overflow-hidden">
        {/* Sizes - Scrollable */}
        <div className="h-full overflow-y-auto p-4">
          {renderSizes(product.sizes)}
        </div>
      </div>
      
      {/* FOOTER - Action Button */}
      <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
        {product.url && (
          <button
            onClick={() => window.open(product.url, '_blank', 'noopener,noreferrer')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
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