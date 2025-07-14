
import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { currencies } from '../config/currencies';
import { FiDollarSign } from 'react-icons/fi';

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="relative">
      <select
        value={currency.code}
        onChange={(e) => {
          const selected = currencies.find(c => c.code === e.target.value);
          if (selected) setCurrency(selected);
        }}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {currencies.map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.symbol} - {curr.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
        <FiDollarSign className="h-4 w-4" />
      </div>
    </div>
  );
};

export default CurrencySelector; 
