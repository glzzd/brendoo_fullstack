import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Store, Globe, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
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
import { usePageTitle } from '@/hooks/usePageTitle';

const StoreList = () => {
  const { stores, loading, error, deleteStore, clearError, getStores } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeToDelete, setStoreToDelete] = useState(null);
  usePageTitle('storeList');

  // Fetch stores when component mounts
  useEffect(() => {
    getStores();
  }, [getStores]);

  // Filter stores based on search term
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.description && store.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteStore = (store) => {
    setStoreToDelete(store);
  };

  const confirmDelete = async () => {
    if (storeToDelete) {
      const success = await deleteStore(storeToDelete._id);
      if (success) {
        // Store deleted successfully
      }
      setStoreToDelete(null);
    }
  };

  const handleEditStore = (store) => {
    setSelectedStore(store);
    setIsModalOpen(true);
  };

  const handleStoreClick = (storeId) => {
    navigate(`/stores/${storeId}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStore(null);
  };

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        clearError();
      }, 5000);
    }
  }, [error, clearError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="h-6 w-6 text-blue-600" />
            {t('stores') || 'Mağazalar'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('manageStores') || 'Mağazalarınızı yönetin ve düzenleyin'}
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('addStore') || 'Mağaza Ekle'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={t('searchStores') || 'Mağaza ara...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Stores Grid */}
      {filteredStores.length === 0 ? (
        <div className="text-center py-12">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? (t('noStoresFound') || 'Mağaza bulunamadı') : (t('noStores') || 'Henüz mağaza yok')}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? (t('tryDifferentSearch') || 'Farklı bir arama terimi deneyin')
              : (t('addFirstStore') || 'İlk mağazanızı ekleyin')
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addStore') || 'Mağaza Ekle'}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store._id}
              onClick={() => handleStoreClick(store._id)}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={`${store.name} logo`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Store className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{store.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(store.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStore(store)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleDeleteStore(store)}
                           className="text-red-600 hover:text-red-700 hover:bg-red-50"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('confirmDelete') || 'Mağazayı Sil'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('confirmDeleteStore') || `"${store.name}" mağazasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
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

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a 
                      href={store.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                    >
                      {store.website}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    {store.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <p className={`text-sm font-medium ${
                      store.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {store.isActive ? (t('active') || 'Aktif') : (t('inactive') || 'Pasif')}
                    </p>
                  </div>
                  {store.description && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-2">{store.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Store Modal */}
      <AddStoreModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        store={selectedStore}
      />
    </div>
  );
};

export default StoreList;