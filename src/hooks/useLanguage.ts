import { useState, useEffect, useCallback } from 'react';
import { type SupportedLanguage } from '@/data/offlineKnowledgeMultilingual';

export function useLanguage() {
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('bis-lang') as SupportedLanguage) || 'en';
  });

  const changeLanguage = useCallback((lang: SupportedLanguage) => {
    localStorage.setItem('bis-lang', lang);
    // Dispatches a storage event for the same window (not natively done by browser)
    window.dispatchEvent(new Event('storage'));
    setLanguage(lang);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedLang = localStorage.getItem('bis-lang') as SupportedLanguage;
      if (storedLang && storedLang !== language) {
        setLanguage(storedLang);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [language]);

  return { language, changeLanguage };
}
