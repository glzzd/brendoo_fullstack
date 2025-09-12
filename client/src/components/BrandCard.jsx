import React from 'react';
import { ExternalLink, Package } from 'lucide-react';

const BrandCard = ({ brandName, brandUrl, imageUrl, onProductsClick }) => {
  const handleExternalClick = (e) => {
    e.stopPropagation();
    if (brandUrl) {
      window.open(brandUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardClick = () => {
    if (onProductsClick) {
      onProductsClick(brandName, brandUrl);
    }
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Brand Image */}
      {imageUrl && (
        <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={brandName}
            className="max-w-full max-h-full object-contain p-2"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">{brandName}</h3>
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-blue-600" />
            <button
              onClick={handleExternalClick}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Brendin səhifəsinə keç"
            >
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">Məhsulları görmək üçün tıklayın</p>
      </div>
    </div>
  );
};

export default BrandCard;