export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
  { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
];

/** How many USD one unit of this currency is worth (demo static rates). */
export const TO_USD_RATE: Record<string, number> = {
  USD: 1,
  EUR: 1.09,
  GBP: 1.27,
  INR: 0.012,
  JPY: 0.0067,
  AUD: 0.65,
  CAD: 0.73,
  CHF: 1.12,
  CNY: 0.14,
  AED: 0.27,
};

function toUsd(amount: number, code: string): number {
  const r = TO_USD_RATE[code] ?? 1;
  return amount * r;
}

function fromUsd(usd: number, code: string): number {
  const r = TO_USD_RATE[code] ?? 1;
  return usd / r;
}

/** Convert `amount` expressed in `fromCode` into user's primary currency. */
export function convertBetweenCurrencies(
  amount: number,
  fromCode: string,
  primaryCode: string
): number {
  return fromUsd(toUsd(amount, fromCode), primaryCode);
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
