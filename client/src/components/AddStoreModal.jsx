import React, { useState, useEffect } from 'react';
import { X, Store, MapPin, Phone, Mail, FileText, Upload, Image } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const AddStoreModal = ({ isOpen, onClose, store = null }) => {
  const { createStore, updateStore, loading, error, clearError } = useStore();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
    logo: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  const isEditing = !!store;

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        website: store.website || '',
        description: store.description || '',
        logo: store.logo || '',
        isActive: store.isActive !== undefined ? store.isActive : true
      });
    } else {
      setFormData({
        name: '',
        website: '',
        description: '',
        logo: '',
        isActive: true
      });
    }
    setFormErrors({});
    clearError();
  }, [store, clearError]);

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = t('nameRequired') || 'Mağaza adı gereklidir';
    }

    if (!formData.website.trim()) {
      errors.website = t('websiteRequired') || 'Website gereklidir';
    } else if (!/^https?:\/\/.+/.test(formData.website)) {
      errors.website = t('websiteInvalid') || 'Geçerli bir website adresi giriniz (http:// veya https:// ile başlamalı)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let success;
      if (isEditing) {
        success = await updateStore(store._id, formData);
      } else {
        success = await createStore(formData);
      }

      if (success) {
        onClose();
      }
    } catch (err) {
      console.error('Error saving store:', err);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({
          ...prev,
          logo: 'Logo boyutu 5MB\'dan küçük olmalıdır'
        }));
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({
          ...prev,
          logo: 'Sadece resim dosyaları yüklenebilir'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          logo: event.target.result
        }));
        // Clear logo error if exists
        if (formErrors.logo) {
          setFormErrors(prev => ({
            ...prev,
            logo: ''
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      website: '',
      description: '',
      logo: '',
      isActive: true
    });
    setFormErrors({});
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing 
                ? (t('editStore') || 'Mağaza Düzenle')
                : (t('addStore') || 'Mağaza Ekle')
              }
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Store className="h-4 w-4 inline mr-2" />
              {t('storeName') || 'Mağaza Adı'} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('enterStoreName') || 'Mağaza adını girin'}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.name && (
              <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Store className="h-4 w-4 inline mr-2" />
              {t('website') || 'Website'} *
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder={t('enterWebsite') || 'Website adresini girin (https://example.com)'}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.website ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.website && (
              <p className="text-red-600 text-sm mt-1">{formErrors.website}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              {t('description') || 'Açıklama'}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('enterDescription') || 'Mağaza açıklamasını girin (isteğe bağlı)'}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="h-4 w-4 inline mr-2" />
              {t('logo') || 'Logo'}
            </label>
            <div className="space-y-3">
              {/* Logo Preview */}
              {formData.logo && (
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <img
                    src={formData.logo}
                    alt="Logo Preview"
                    className="max-h-28 max-w-full object-contain rounded"
                  />
                </div>
              )}
              
              {/* File Input */}
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${
                  formErrors.logo ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                } ${formData.logo ? 'hidden' : ''}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">{t('clickToUpload') || 'Yüklemek için tıklayın'}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
              
              {/* Change Logo Button */}
              {formData.logo && (
                <div className="flex justify-center">
                  <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('changeLogo') || 'Logo Değiştir'}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>
              )}
            </div>
            {formErrors.logo && (
              <p className="text-red-600 text-sm mt-1">{formErrors.logo}</p>
            )}
          </div>

          {/* Is Active */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              {t('isActive') || 'Aktif'}
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              {t('cancel') || 'İptal'}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('saving') || 'Kaydediliyor...'}
                </div>
              ) : (
                isEditing ? (t('update') || 'Güncelle') : (t('add') || 'Ekle')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStoreModal;