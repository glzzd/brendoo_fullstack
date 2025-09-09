import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ className = '' }) => {
  const { currentLanguage, changeLanguage, availableLanguages, t } = useLanguage();

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gray-600" />
        <select
          value={currentLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
          className="bg-transparent border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          aria-label={t('language')}
        >
          {availableLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSwitcher;