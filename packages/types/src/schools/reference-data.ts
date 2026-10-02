/**
 * Countries offered during onboarding, with sensible defaults for each.
 * Schools can still choose any valid IANA time zone and ISO 4217 currency;
 * this list only pre-fills the onboarding form. Bangladesh is the launch market.
 */
export interface CountryDefaults {
  readonly code: string;
  readonly name: string;
  readonly timezone: string;
  readonly currencyCode: string;
}

export const COUNTRIES: readonly CountryDefaults[] = [
  { code: 'BD', name: 'Bangladesh', timezone: 'Asia/Dhaka', currencyCode: 'BDT' },
  { code: 'IN', name: 'India', timezone: 'Asia/Kolkata', currencyCode: 'INR' },
  { code: 'PK', name: 'Pakistan', timezone: 'Asia/Karachi', currencyCode: 'PKR' },
  { code: 'NP', name: 'Nepal', timezone: 'Asia/Kathmandu', currencyCode: 'NPR' },
  { code: 'LK', name: 'Sri Lanka', timezone: 'Asia/Colombo', currencyCode: 'LKR' },
  { code: 'MY', name: 'Malaysia', timezone: 'Asia/Kuala_Lumpur', currencyCode: 'MYR' },
  { code: 'SG', name: 'Singapore', timezone: 'Asia/Singapore', currencyCode: 'SGD' },
  { code: 'AE', name: 'United Arab Emirates', timezone: 'Asia/Dubai', currencyCode: 'AED' },
  { code: 'SA', name: 'Saudi Arabia', timezone: 'Asia/Riyadh', currencyCode: 'SAR' },
  { code: 'GB', name: 'United Kingdom', timezone: 'Europe/London', currencyCode: 'GBP' },
  { code: 'US', name: 'United States', timezone: 'America/New_York', currencyCode: 'USD' },
  { code: 'CA', name: 'Canada', timezone: 'America/Toronto', currencyCode: 'CAD' },
  { code: 'AU', name: 'Australia', timezone: 'Australia/Sydney', currencyCode: 'AUD' },
];

export const DEFAULT_COUNTRY_CODE = 'BD';

export function findCountry(code: string): CountryDefaults | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

/** True when the runtime recognises the IANA time zone (aliases included). */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return true;
  } catch {
    return false;
  }
}

let supportedCurrencies: ReadonlySet<string> | undefined;

/** True for ISO 4217 codes the runtime knows (Intl.NumberFormat alone accepts any 3 letters). */
export function isValidCurrencyCode(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) return false;
  supportedCurrencies ??= new Set(Intl.supportedValuesOf('currency'));
  return supportedCurrencies.has(code);
}
