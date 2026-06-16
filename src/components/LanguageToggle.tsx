import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Persistent language toggle (EN / ಕನ್ನಡ) fixed at the top-right of the header.
 * Large touch targets for rural mobile users.
 */
export default function LanguageToggle() {
  const { lang, setLanguage } = useLanguage();

  return (
    <div className="lang-toggle" role="radiogroup" aria-label="Language selector">
      <button
        role="radio"
        aria-checked={lang === 'en'}
        className={lang === 'en' ? 'active' : ''}
        onClick={() => setLanguage('en')}
        id="lang-toggle-en"
      >
        EN
      </button>
      <button
        role="radio"
        aria-checked={lang === 'kn'}
        className={lang === 'kn' ? 'active' : ''}
        onClick={() => setLanguage('kn')}
        id="lang-toggle-kn"
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
}
