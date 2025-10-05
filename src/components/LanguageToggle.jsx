import { motion } from "framer-motion";

const LanguageToggle = ({ currentLanguage, onLanguageChange, colors }) => {
  const languages = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'id', label: 'ID', flag: '🇮🇩' }
  ];

  return (
    <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-lg border">
      {languages.map((lang) => (
        <motion.button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          className={`px-3 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            currentLanguage === lang.code 
              ? 'text-white shadow-md' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          style={{
            backgroundColor: currentLanguage === lang.code ? colors.navy : 'transparent'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          aria-label={`Switch to ${lang.label}`}
        >
          <span className="text-lg">{lang.flag}</span>
          <span>{lang.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default LanguageToggle;