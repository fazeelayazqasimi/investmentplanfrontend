// Top ~20 countries with dial codes + flag images (flagcdn.com)
export const COUNTRIES = [
  { code: 'PK', dial: '+92', name: 'Pakistan' },
  { code: 'IN', dial: '+91', name: 'India' },
  { code: 'US', dial: '+1', name: 'United States' },
  { code: 'GB', dial: '+44', name: 'United Kingdom' },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia' },
  { code: 'CA', dial: '+1', name: 'Canada' },
  { code: 'AU', dial: '+61', name: 'Australia' },
  { code: 'DE', dial: '+49', name: 'Germany' },
  { code: 'FR', dial: '+33', name: 'France' },
  { code: 'NL', dial: '+31', name: 'Netherlands' },
  { code: 'TR', dial: '+90', name: 'Turkey' },
  { code: 'MY', dial: '+60', name: 'Malaysia' },
  { code: 'SG', dial: '+65', name: 'Singapore' },
  { code: 'BD', dial: '+880', name: 'Bangladesh' },
  { code: 'NG', dial: '+234', name: 'Nigeria' },
  { code: 'ZA', dial: '+27', name: 'South Africa' },
  { code: 'BR', dial: '+55', name: 'Brazil' },
  { code: 'ID', dial: '+62', name: 'Indonesia' },
  { code: 'QA', dial: '+974', name: 'Qatar' },
].map((c) => ({ ...c, flag: `https://flagcdn.com/w40/${c.code.toLowerCase()}.png` }));

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Pakistan +92
