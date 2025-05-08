// src/app/(marketing)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShopSavvy - Your Smart Shopping Companion',
  description: 'Compare prices, track deals, and save money with ShopSavvy, your AI-powered shopping assistant.',
};

export default function MarketingLayout({
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
