import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Globe, Edit, Trash2, CheckCircle, XCircle, MapPin, Phone, Mail, Tag } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import AddStoreModal from '../../components/AddStoreModal';
import BrandCard from '../../components/BrandCard';
import ProductModal from '../../components/ProductModal';
import brandService from '../../api/brandService';
import productService from '../../api/productService';
import { usePageTitle } from '@/hooks/usePageTitle';

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentStore, loading, error, getStore, deleteStore, clearError } = useStore();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [brands, setBrands] = useState({});
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState(null);
  
  // Product modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState({ name: '', url: '' });
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  usePageTitle('storeDetail');

  // Fetch brands from GoSport API
  const fetchBrands = useCallback(async () => {
    setBrandsLoading(true);
    setBrandsError(null);
    try {
      const brandsData = await brandService.getBrands();
      setBrands(brandsData);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrandsError('Brendlər yüklənərkən xəta baş verdi');
    } finally {
      setBrandsLoading(false);
    }
  }, []);

  // Fetch products by brand URL
  const fetchProducts = useCallback(async (brandUrl) => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const productsData = await productService.getProductsByBrand(brandUrl);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsError('Məhsullar yüklənərkən xəta baş verdi');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Handle brand card click to open product modal
  const handleBrandClick = useCallback((brandName, brandUrl) => {
    setSelectedBrand({ name: brandName, url: brandUrl });
    setIsProductModalOpen(true);
    fetchProducts(brandUrl);
  }, [fetchProducts]);

  // Handle product modal close
  const handleProductModalClose = useCallback(() => {
    setIsProductModalOpen(false);
    setSelectedBrand({ name: '', url: '' });
    setProducts([]);
    setProductsError(null);
  }, []);

  useEffect(() => {
    if (id) {
      getStore(id);
    }
  }, [id, getStore]);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        clearError();
      }, 5000);
    }
  }, [error, clearError]);

  const handleDeleteStore = (store) => {
    setStoreToDelete(store);
  };

  const confirmDelete = async () => {
    if (storeToDelete) {
      const success = await deleteStore(storeToDelete._id);
      if (success) {
        navigate('/stores/list');
      }
      setStoreToDelete(null);
    }
  };

  const handleEditStore = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleBackToList = () => {
    navigate('/stores/list');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('storeNotFound') || 'Mağaza bulunamadı'}
          </h3>
          <p className="text-gray-500 mb-4">
            {t('storeNotFoundDescription') || 'Aradığınız mağaza bulunamadı veya silinmiş olabilir.'}
          </p>
          <Button
            onClick={handleBackToList}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToStores') || 'Mağazalara Dön'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBackToList}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('back') || 'Geri'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-blue-600" />
              {currentStore.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('storeDetails') || 'Mağaza Detayları'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleEditStore}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {t('edit') || 'Düzenle'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                onClick={() => handleDeleteStore(currentStore)}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t('delete') || 'Sil'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('confirmDelete') || 'Silmeyi Onayla'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteStoreConfirmation') || 'Bu mağazayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel') || 'İptal'}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => confirmDelete()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {t('delete') || 'Sil'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Store Details Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Store Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden">
              {currentStore.logo ? (
                <img
                  src={currentStore.logo}
                  alt={currentStore.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="h-10 w-10 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentStore.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                {currentStore.isActive ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span className="text-green-100">{t('active') || 'Aktif'}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-300" />
                    <span className="text-red-100">{t('inactive') || 'Pasif'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('basicInfo') || 'Temel Bilgiler'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">{t('website') || 'Website'}</p>
                    <a 
                      href={currentStore.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {currentStore.website}
                    </a>
                  </div>
                </div>
                
                {currentStore.description && (
                  <div className="flex items-start gap-3">
                    <Store className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('description') || 'Açıklama'}</p>
                      <p className="text-gray-900">{currentStore.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('additionalInfo') || 'Ek Bilgiler'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('createdAt') || 'Oluşturulma Tarihi'}</p>
                    <p className="text-gray-900">
                      {currentStore.createdAt ? new Date(currentStore.createdAt).toLocaleDateString('tr-TR') : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('lastUpdated') || 'Son Güncelleme'}</p>
                    <p className="text-gray-900">
                      {currentStore.updatedAt ? new Date(currentStore.updatedAt).toLocaleDateString('tr-TR') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Tag className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('categories') || 'Kategoriler'}
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          {brandsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Kateqoriyalar yüklənir...</span>
            </div>
          ) : brandsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Kateqoriyalar yüklənərkən xəta baş verdi!</p>
              <p className="text-gray-500 text-sm">{brandsError}</p>
              <button 
                onClick={fetchBrands}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          ) : Object.keys(brands).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {console.log(brands)
              }
              {Object.entries(brands).map(([brandName, brandUrl]) => {
                const safeUrl = typeof brandUrl === 'string' ? brandUrl.trim().replace(/"/g, '') : String(brandUrl || '').replace(/"/g, '');
                return (
                  <BrandCard 
                    key={brandName}
                    brandName={brandName}
                    brandUrl={safeUrl}
                    onProductsClick={handleBrandClick}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Kateqoriya tapılmadı</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Store Modal */}
      <AddStoreModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        store={currentStore}
      />

      {/* Product Modal */}
      <ProductModal
         isOpen={isProductModalOpen}
         onClose={handleProductModalClose}
         brandName={selectedBrand.name}
         brandUrl={selectedBrand.url}
         products={products}
         loading={productsLoading}
         error={productsError}
       />
    </div>
  );
};

export default StoreDetail;