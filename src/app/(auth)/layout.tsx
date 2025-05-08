// src/app/(auth)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - ShopSavvy',
  description: 'Sign in or create an account to use ShopSavvy, your AI-powered shopping assistant.',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
