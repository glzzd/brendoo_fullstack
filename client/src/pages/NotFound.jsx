import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { Home } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const NotFound = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Sayfa başlığını güncelle
  usePageTitle('notFound');

  const handleGoHome = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">{t('pageNotFound')}</p>
        <button 
          onClick={handleGoHome}
          className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
        >
          <Home className="w-5 h-5" />
          <span>{t('backToHome')}</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;