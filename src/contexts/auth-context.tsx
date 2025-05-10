'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseAdmin, type SupabaseUser } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Fallback function if toast hook is not available
const fallbackToast = {
  toast: (props: any) => {
    console.log('Toast:', props);
  }
};

type AuthContextType = {
  user: SupabaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use try/catch to handle potential errors with the toast hook
  let toastFn;
  try {
    toastFn = useToast();
  } catch (error) {
    console.warn('Toast hook not available, using fallback', error);
    toastFn = fallbackToast;
  }

  const { toast } = toastFn;

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      try {
        console.log('Checking for active session...');

        // First check for an existing session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Set the user based on the session
        setUser(data.session?.user || null);
        console.log('Session check complete, user:', data.session?.user ? 'Found' : 'Not found');
      } catch (error) {
        console.error('Error checking auth session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial session check
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Auth context: Signing in with email', email);

      // Use the admin client for authentication
      console.log('Using admin client for authentication');
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

      // If successful, also set the session in the regular client
      if (!error && data.session) {
        console.log('Setting session in regular client');
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful:', data);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
    } catch (error: any) {
      console.error('Sign in exception:', error);
      toast({
        title: 'Sign in failed',
        description: error.message || 'An error occurred during sign in.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Auth context: Signing up with email', email);

      // Use the admin client for authentication
      console.log('Using admin client for authentication');
      const { data, error } = await supabaseAdmin.auth.signUp({ email, password });

      // If successful and auto-confirm is enabled, also set the session in the regular client
      if (!error && data.session) {
        console.log('Setting session in regular client');
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }

      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }

      console.log('Sign up successful:', data);
      toast({
        title: 'Account created!',
        description: 'Please check your email to confirm your account.',
      });
    } catch (error: any) {
      console.error('Sign up exception:', error);
      toast({
        title: 'Sign up failed',
        description: error.message || 'An error occurred during sign up.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log('Auth context: Signing out');
      console.log('Using regular client for authentication to ensure session persistence');

      // Set a flag to indicate we're in the process of signing out
      // This prevents the app layout from redirecting to login
      sessionStorage.setItem('signing_out', 'true');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }

      console.log('Sign out successful');
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });

      // Redirect to landing page after sign out
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign out exception:', error);
      toast({
        title: 'Sign out failed',
        description: error.message || 'An error occurred during sign out.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      console.log('Auth context: Resetting password for email', email);
      console.log('Using regular client for authentication to ensure session persistence');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      console.log('Password reset email sent successfully');
      toast({
        title: 'Password reset email sent',
        description: 'Please check your email for the password reset link.',
      });
    } catch (error: any) {
      console.error('Password reset exception:', error);
      toast({
        title: 'Password reset failed',
        description: error.message || 'An error occurred during password reset.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
