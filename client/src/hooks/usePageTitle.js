import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const usePageTitle = (titleKey) => {
  const { t } = useLanguage();

  useEffect(() => {
    const title = t(`pageTitle.${titleKey}`) || 'Brendoo';
    document.title = title;
  }, [titleKey, t]);
};