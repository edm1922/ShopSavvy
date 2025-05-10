'use client';

import { useCurrency, CurrencyCode, currencySymbols } from '@/contexts/currency-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

/**
 * Currency selector dropdown component
 */
export function CurrencySelector() {
  const { currency, setCurrency, currencySymbol } = useCurrency();

  // Currency options with labels
  const currencyOptions: { code: CurrencyCode; label: string }[] = [
    { code: 'PHP', label: 'Philippine Peso (₱)' },
    { code: 'USD', label: 'US Dollar ($)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'SGD', label: 'Singapore Dollar (S$)' },
    { code: 'MYR', label: 'Malaysian Ringgit (RM)' },
    { code: 'THB', label: 'Thai Baht (฿)' },
    { code: 'IDR', label: 'Indonesian Rupiah (Rp)' },
    { code: 'VND', label: 'Vietnamese Dong (₫)' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 px-0 bg-transparent border-0 hover:bg-purple-800/50">
          <span className="sr-only">Change currency</span>
          <span className="text-sm font-medium text-pink-400">{currencySymbol}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-indigo-950 border border-purple-500/30 text-white">
        {currencyOptions.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => setCurrency(option.code)}
            className={currency === option.code ? 'bg-pink-500/20 text-pink-300' : 'hover:bg-purple-800/50 hover:text-pink-300'}
          >
            <span className="mr-2">{currencySymbols[option.code]}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
