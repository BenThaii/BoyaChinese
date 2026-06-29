/**
 * Hook to manage keyboard language switching for multilingual inputs
 * On iOS, this will automatically switch the keyboard language when focus changes
 */

export type KeyboardLanguage = 'zh' | 'en' | 'vi';

interface LanguageConfig {
  lang: string;
  inputMode?: 'text' | 'none' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
}

const LANGUAGE_CONFIGS: Record<KeyboardLanguage, LanguageConfig> = {
  zh: {
    lang: 'zh-CN',
    inputMode: 'text'
  },
  en: {
    lang: 'en-US',
    inputMode: 'text'
  },
  vi: {
    lang: 'vi-VN',
    inputMode: 'text'
  }
};

/**
 * Get the language configuration for a specific keyboard language
 */
export const getLanguageConfig = (language: KeyboardLanguage): LanguageConfig => {
  return LANGUAGE_CONFIGS[language];
};

/**
 * Map field names to keyboard languages
 * Used to determine which keyboard language should be active for each field
 */
export const getFieldLanguage = (fieldName: string): KeyboardLanguage => {
  switch (fieldName.toLowerCase()) {
    case 'chinese':
    case 'chinesecharacter':
      return 'zh';
    case 'english':
    case 'englishmeaning':
      return 'en';
    case 'vietnamese':
    case 'modernvietnamese':
    case 'hanvietnamese':
    case 'learningnote':
      return 'vi';
    default:
      return 'en';
  }
};
