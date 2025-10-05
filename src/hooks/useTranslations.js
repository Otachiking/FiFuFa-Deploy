import { translations } from '../utils/translations';

export const useTranslation = (language) => {
  const t = (key, variables = {}) => {
    let text = translations[language]?.[key] || translations['en'][key] || key;
    
    // Replace variables in text
    Object.keys(variables).forEach(variable => {
      text = text.replace(`{${variable}}`, variables[variable]);
    });
    
    return text;
  };
  
  return { t };
};