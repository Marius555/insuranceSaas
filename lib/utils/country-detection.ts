/**
 * Country detection utility using browser timezone
 * Used for localizing Gemini AI repair cost estimates to user's country
 */

// Timezone to country + currency mapping
const TIMEZONE_DATA: Record<string, { country: string; currency: string; currencySymbol: string }> = {
  // USA
  'America/New_York': { country: 'United States', currency: 'USD', currencySymbol: '$' },
  'America/Los_Angeles': { country: 'United States', currency: 'USD', currencySymbol: '$' },
  'America/Chicago': { country: 'United States', currency: 'USD', currencySymbol: '$' },
  'America/Denver': { country: 'United States', currency: 'USD', currencySymbol: '$' },
  'America/Phoenix': { country: 'United States', currency: 'USD', currencySymbol: '$' },
  'America/Anchorage': { country: 'United States', currency: 'USD', currencySymbol: '$' },
  'Pacific/Honolulu': { country: 'United States', currency: 'USD', currencySymbol: '$' },

  // Europe
  'Europe/London': { country: 'United Kingdom', currency: 'GBP', currencySymbol: '£' },
  'Europe/Paris': { country: 'France', currency: 'EUR', currencySymbol: '€' },
  'Europe/Berlin': { country: 'Germany', currency: 'EUR', currencySymbol: '€' },
  'Europe/Madrid': { country: 'Spain', currency: 'EUR', currencySymbol: '€' },
  'Europe/Rome': { country: 'Italy', currency: 'EUR', currencySymbol: '€' },
  'Europe/Amsterdam': { country: 'Netherlands', currency: 'EUR', currencySymbol: '€' },
  'Europe/Brussels': { country: 'Belgium', currency: 'EUR', currencySymbol: '€' },
  'Europe/Vienna': { country: 'Austria', currency: 'EUR', currencySymbol: '€' },
  'Europe/Zurich': { country: 'Switzerland', currency: 'CHF', currencySymbol: 'CHF' },
  'Europe/Warsaw': { country: 'Poland', currency: 'PLN', currencySymbol: 'zł' },
  'Europe/Prague': { country: 'Czech Republic', currency: 'CZK', currencySymbol: 'Kč' },
  'Europe/Stockholm': { country: 'Sweden', currency: 'SEK', currencySymbol: 'kr' },
  'Europe/Oslo': { country: 'Norway', currency: 'NOK', currencySymbol: 'kr' },
  'Europe/Copenhagen': { country: 'Denmark', currency: 'DKK', currencySymbol: 'kr' },
  'Europe/Helsinki': { country: 'Finland', currency: 'EUR', currencySymbol: '€' },
  'Europe/Dublin': { country: 'Ireland', currency: 'EUR', currencySymbol: '€' },
  'Europe/Lisbon': { country: 'Portugal', currency: 'EUR', currencySymbol: '€' },
  'Europe/Athens': { country: 'Greece', currency: 'EUR', currencySymbol: '€' },

  // Baltic States
  'Europe/Vilnius': { country: 'Lithuania', currency: 'EUR', currencySymbol: '€' },
  'Europe/Riga': { country: 'Latvia', currency: 'EUR', currencySymbol: '€' },
  'Europe/Tallinn': { country: 'Estonia', currency: 'EUR', currencySymbol: '€' },

  // Eastern Europe
  'Europe/Bucharest': { country: 'Romania', currency: 'RON', currencySymbol: 'lei' },
  'Europe/Budapest': { country: 'Hungary', currency: 'HUF', currencySymbol: 'Ft' },
  'Europe/Sofia': { country: 'Bulgaria', currency: 'BGN', currencySymbol: 'лв' },
  'Europe/Belgrade': { country: 'Serbia', currency: 'RSD', currencySymbol: 'дин.' },
  'Europe/Zagreb': { country: 'Croatia', currency: 'EUR', currencySymbol: '€' },
  'Europe/Ljubljana': { country: 'Slovenia', currency: 'EUR', currencySymbol: '€' },
  'Europe/Bratislava': { country: 'Slovakia', currency: 'EUR', currencySymbol: '€' },
  'Europe/Kiev': { country: 'Ukraine', currency: 'UAH', currencySymbol: '₴' },
  'Europe/Kyiv': { country: 'Ukraine', currency: 'UAH', currencySymbol: '₴' },
  'Europe/Moscow': { country: 'Russia', currency: 'RUB', currencySymbol: '₽' },
  'Europe/Minsk': { country: 'Belarus', currency: 'BYN', currencySymbol: 'Br' },

  // Additional Western Europe
  'Europe/Luxembourg': { country: 'Luxembourg', currency: 'EUR', currencySymbol: '€' },
  'Atlantic/Reykjavik': { country: 'Iceland', currency: 'ISK', currencySymbol: 'kr' },

  // Asia
  'Asia/Tokyo': { country: 'Japan', currency: 'JPY', currencySymbol: '¥' },
  'Asia/Shanghai': { country: 'China', currency: 'CNY', currencySymbol: '¥' },
  'Asia/Hong_Kong': { country: 'Hong Kong', currency: 'HKD', currencySymbol: 'HK$' },
  'Asia/Seoul': { country: 'South Korea', currency: 'KRW', currencySymbol: '₩' },
  'Asia/Singapore': { country: 'Singapore', currency: 'SGD', currencySymbol: 'S$' },
  'Asia/Taipei': { country: 'Taiwan', currency: 'TWD', currencySymbol: 'NT$' },
  'Asia/Bangkok': { country: 'Thailand', currency: 'THB', currencySymbol: '฿' },
  'Asia/Kuala_Lumpur': { country: 'Malaysia', currency: 'MYR', currencySymbol: 'RM' },
  'Asia/Jakarta': { country: 'Indonesia', currency: 'IDR', currencySymbol: 'Rp' },
  'Asia/Manila': { country: 'Philippines', currency: 'PHP', currencySymbol: '₱' },
  'Asia/Ho_Chi_Minh': { country: 'Vietnam', currency: 'VND', currencySymbol: '₫' },
  'Asia/Kolkata': { country: 'India', currency: 'INR', currencySymbol: '₹' },
  'Asia/Dubai': { country: 'United Arab Emirates', currency: 'AED', currencySymbol: 'د.إ' },
  'Asia/Riyadh': { country: 'Saudi Arabia', currency: 'SAR', currencySymbol: '﷼' },
  'Asia/Tel_Aviv': { country: 'Israel', currency: 'ILS', currencySymbol: '₪' },

  // Australia & Oceania
  'Australia/Sydney': { country: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
  'Australia/Melbourne': { country: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
  'Australia/Brisbane': { country: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
  'Australia/Perth': { country: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
  'Pacific/Auckland': { country: 'New Zealand', currency: 'NZD', currencySymbol: 'NZ$' },

  // Canada
  'America/Toronto': { country: 'Canada', currency: 'CAD', currencySymbol: 'C$' },
  'America/Vancouver': { country: 'Canada', currency: 'CAD', currencySymbol: 'C$' },
  'America/Montreal': { country: 'Canada', currency: 'CAD', currencySymbol: 'C$' },
  'America/Edmonton': { country: 'Canada', currency: 'CAD', currencySymbol: 'C$' },

  // Latin America
  'America/Mexico_City': { country: 'Mexico', currency: 'MXN', currencySymbol: '$' },
  'America/Sao_Paulo': { country: 'Brazil', currency: 'BRL', currencySymbol: 'R$' },
  'America/Buenos_Aires': { country: 'Argentina', currency: 'ARS', currencySymbol: '$' },
  'America/Santiago': { country: 'Chile', currency: 'CLP', currencySymbol: '$' },
  'America/Bogota': { country: 'Colombia', currency: 'COP', currencySymbol: '$' },
  'America/Lima': { country: 'Peru', currency: 'PEN', currencySymbol: 'S/' },

  // Africa
  'Africa/Johannesburg': { country: 'South Africa', currency: 'ZAR', currencySymbol: 'R' },
  'Africa/Cairo': { country: 'Egypt', currency: 'EGP', currencySymbol: 'E£' },
  'Africa/Lagos': { country: 'Nigeria', currency: 'NGN', currencySymbol: '₦' },
  'Africa/Nairobi': { country: 'Kenya', currency: 'KES', currencySymbol: 'KSh' },
};

type LocationData = { country: string; currency: string; currencySymbol: string };

const DEFAULT_LOCATION: LocationData = { country: 'United States', currency: 'USD', currencySymbol: '$' };

/**
 * Get regional fallback based on timezone prefix when exact match not found
 * @param timezone - The user's timezone string
 * @returns LocationData with region-appropriate defaults
 */
function getRegionalFallback(timezone: string): LocationData {
  if (timezone.startsWith('Europe/')) {
    return { country: 'European Union', currency: 'EUR', currencySymbol: '€' };
  }
  if (timezone.startsWith('Asia/')) {
    return { country: 'Asia', currency: 'USD', currencySymbol: '$' };
  }
  if (timezone.startsWith('Africa/')) {
    return { country: 'Africa', currency: 'USD', currencySymbol: '$' };
  }
  if (timezone.startsWith('Australia/') || timezone.startsWith('Pacific/')) {
    return { country: 'Australia', currency: 'AUD', currencySymbol: 'A$' };
  }
  if (timezone.startsWith('America/')) {
    return { country: 'United States', currency: 'USD', currencySymbol: '$' };
  }
  return DEFAULT_LOCATION;
}

/**
 * Get user location info based on browser timezone
 * @returns Object containing country, currency code, and currency symbol
 */
export function getUserLocation(): LocationData {
  if (typeof window === 'undefined') return DEFAULT_LOCATION;

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_DATA[timezone] || getRegionalFallback(timezone);
  } catch {
    return DEFAULT_LOCATION;
  }
}

/**
 * Get country name from browser timezone
 * @returns Country name string
 */
export function getCountryFromTimezone(): string {
  return getUserLocation().country;
}

/**
 * Get currency info from browser timezone
 * @returns Object with currency code and symbol
 */
export function getCurrencyFromTimezone(): { currency: string; currencySymbol: string } {
  const location = getUserLocation();
  return { currency: location.currency, currencySymbol: location.currencySymbol };
}
