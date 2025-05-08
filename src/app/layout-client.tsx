'use client';

import { Toaster } from "@/components/ui/toaster";
import dynamic from 'next/dynamic';

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
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
