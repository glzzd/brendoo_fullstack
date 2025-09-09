import React, { createContext, useContext, useState, useEffect } from 'react';
import azTranslations from '../locales/az.json';
import enTranslations from '../locales/en.json';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Çeviri verileri JSON dosyalarından import edildi
const translations = {
  az: azTranslations,
  en: enTranslations
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('az');

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan dil tercihini kontrol et
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'az' || savedLanguage === 'en')) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (language) => {
    if (language === 'az' || language === 'en') {
      setCurrentLanguage(language);
      localStorage.setItem('language', language);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Anahtar bulunamazsa orijinal anahtarı döndür
      }
    }
    
    return value || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages: [
      { code: 'az', name: 'Azərbaycan' },
      { code: 'en', name: 'English' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};