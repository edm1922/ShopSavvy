'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define supported currencies
export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'SGD' | 'MYR' | 'THB' | 'IDR' | 'VND';

// Currency symbol mapping
export const currencySymbols: Record<CurrencyCode, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  IDR: 'Rp',
  VND: '₫'
};

// Exchange rates relative to PHP (base currency)
// These would ideally come from an API, but we'll use fixed rates for now
export const exchangeRates: Record<CurrencyCode, number> = {
  PHP: 1,
  USD: 0.018,  // 1 PHP = 0.018 USD
  EUR: 0.016,  // 1 PHP = 0.016 EUR
  SGD: 0.024,  // 1 PHP = 0.024 SGD
  MYR: 0.083,  // 1 PHP = 0.083 MYR
  THB: 0.63,   // 1 PHP = 0.63 THB
  IDR: 280,    // 1 PHP = 280 IDR
  VND: 450,    // 1 PHP = 450 VND
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (price: number) => string;
  convertPrice: (price: number) => number;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Default to PHP, but try to load from localStorage
  const [currency, setCurrency] = useState<CurrencyCode>('PHP');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved currency preference on mount
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('currency') as CurrencyCode;
      if (savedCurrency && Object.keys(exchangeRates).includes(savedCurrency)) {
        setCurrency(savedCurrency);
      }
    } catch (error) {
      console.error('Error loading currency preference:', error);
    }
    setIsInitialized(true);
  }, []);

  // Save currency preference when it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('currency', currency);
      } catch (error) {
        console.error('Error saving currency preference:', error);
      }
    }
  }, [currency, isInitialized]);

  // Convert price from PHP to selected currency
  const convertPrice = (priceInPHP: number): number => {
    if (!priceInPHP) return 0;
    return priceInPHP * exchangeRates[currency];
  };

  // Format price with currency symbol and proper decimal places
  const formatPrice = (priceInPHP: number): string => {
    const convertedPrice = convertPrice(priceInPHP);
    
    // Format based on currency
    switch (currency) {
      case 'IDR':
      case 'VND':
        // These currencies typically don't use decimal places
        return `${currencySymbols[currency]}${Math.round(convertedPrice).toLocaleString()}`;
      default:
        // Most currencies use 2 decimal places
        return `${currencySymbols[currency]}${convertedPrice.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice,
      convertPrice,
      currencySymbol: currencySymbols[currency]
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
