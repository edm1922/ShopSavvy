'use client';

import { Toaster } from "@/components/ui/toaster";
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { CurrencyProvider } from '@/contexts/currency-context';

// Dynamically import AuthProvider with no SSR to avoid hydration issues
const AuthProvider = dynamic(
  () => import('@/contexts/auth-context').then(mod => mod.AuthProvider),
  { ssr: false }
);

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <CurrencyProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
