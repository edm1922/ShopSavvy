'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/app/Header';
import { supabase } from '@/lib/supabase';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user && pathname !== '/login' && pathname !== '/register') {
      console.log('No authenticated user found, redirecting to login');

      // Don't redirect if we're in the process of signing out (which will handle its own redirection)
      const isSigningOut = sessionStorage.getItem('signing_out') === 'true';
      if (!isSigningOut) {
        router.push('/login');
      }
    } else if (!isLoading && user) {
      console.log('Authenticated user found:', user.email);
      // Clear any signing out flag
      sessionStorage.removeItem('signing_out');
    }
  }, [user, isLoading, router, pathname]);

  // Add a second effect to handle session refresh
  useEffect(() => {
    // Function to refresh the session
    const refreshSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error refreshing session:', error);
          // Don't redirect if we're in the process of signing out
          const isSigningOut = sessionStorage.getItem('signing_out') === 'true';
          if (!user && pathname !== '/login' && pathname !== '/register' && !isSigningOut) {
            router.push('/login');
          }
        } else if (data.session) {
          console.log('Session refreshed successfully');
        }
      } catch (error) {
        console.error('Error in session refresh:', error);
      }
    };

    // Refresh the session when the component mounts
    refreshSession();

    // Set up an interval to refresh the session periodically
    const intervalId = setInterval(refreshSession, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(intervalId);
  }, [router, pathname, user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-indigo-950 to-purple-950 text-white">
      {/* Abstract gradient shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[400px] -left-[300px] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[100px]"></div>
        <div className="absolute top-[100px] -right-[300px] w-[600px] h-[600px] rounded-full bg-blue-700/20 blur-[100px]"></div>
        <div className="absolute -bottom-[400px] left-[30%] w-[800px] h-[800px] rounded-full bg-pink-700/20 blur-[100px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="mt-auto border-t border-purple-800/30 py-6 text-center text-sm text-purple-200">
          <p>&copy; {new Date().getFullYear()} ShopSavvy. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
