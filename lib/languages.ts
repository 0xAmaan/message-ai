// Supported languages for auto-translation
export interface Language {
  code: string; // Language code for API
  name: string; // Display name
  flag: string; // Flag emoji
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "English", name: "English", flag: "🇺🇸" },
  { code: "Spanish", name: "Spanish", flag: "🇪🇸" },
  { code: "French", name: "French", flag: "🇫🇷" },
  { code: "German", name: "German", flag: "🇩🇪" },
  { code: "Chinese", name: "Chinese", flag: "🇨🇳" },
  { code: "Japanese", name: "Japanese", flag: "🇯🇵" },
  { code: "Korean", name: "Korean", flag: "🇰🇷" },
  { code: "Arabic", name: "Arabic", flag: "🇸🇦" },
  { code: "Hindi", name: "Hindi", flag: "🇮🇳" },
  { code: "Portuguese", name: "Portuguese", flag: "🇵🇹" },
  { code: "Russian", name: "Russian", flag: "🇷🇺" },
  { code: "Italian", name: "Italian", flag: "🇮🇹" },
  { code: "Dutch", name: "Dutch", flag: "🇳🇱" },
  { code: "Turkish", name: "Turkish", flag: "🇹🇷" },
  { code: "Polish", name: "Polish", flag: "🇵🇱" },
  { code: "Swedish", name: "Swedish", flag: "🇸🇪" },
  { code: "Vietnamese", name: "Vietnamese", flag: "🇻🇳" },
  { code: "Thai", name: "Thai", flag: "🇹🇭" },
  { code: "Indonesian", name: "Indonesian", flag: "🇮🇩" },
  { code: "Hebrew", name: "Hebrew", flag: "🇮🇱" },
];

export const DEFAULT_LANGUAGE = "English";

// Helper to get language by code
export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
};

// Helper to get flag emoji for language code
export const getLanguageFlag = (code: string): string => {
  const language = getLanguageByCode(code);
  return language?.flag || "🌐";
};
