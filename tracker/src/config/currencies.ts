
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const currencies: Currency[] = [
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US'
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE'
  },
  {
    code: 'RWF',
    symbol: 'RF',
    name: 'Rwandan Franc',
    locale: 'rw-RW'
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB'
  },
  {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    locale: 'sw-KE'
  }
];

export const defaultCurrency: Currency = currencies[0];

export const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}; 
