'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      console.log('Signing up with:', { email, password });
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Supabase Key (first 10 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        console.error('Sign up error:', error);
      } else {
        setMessage(`Success! Check your email for confirmation. User: ${data?.user?.id}`);
        console.log('Sign up success:', data);
      }
    } catch (err: any) {
      setMessage(`Exception: ${err.message}`);
      console.error('Sign up exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      console.log('Signing in with:', { email, password });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        console.error('Sign in error:', error);
      } else {
        setMessage(`Signed in successfully! User: ${data?.user?.id}`);
        console.log('Sign in success:', data);
      }
    } catch (err: any) {
      setMessage(`Exception: ${err.message}`);
      console.error('Sign in exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setMessage(`Error: ${error.message}`);
        console.error('Session error:', error);
      } else {
        setMessage(`Session: ${data?.session ? 'Active' : 'None'}`);
        console.log('Session data:', data);
      }
    } catch (err: any) {
      setMessage(`Exception: ${err.message}`);
      console.error('Session exception:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-bold">Supabase Auth Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>
        
        <div className="flex space-x-4">
          <Button onClick={handleSignUp} disabled={loading}>
            {loading ? 'Loading...' : 'Sign Up'}
          </Button>
          
          <Button onClick={handleSignIn} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Sign In'}
          </Button>
          
          <Button onClick={checkSession} disabled={loading} variant="secondary">
            Check Session
          </Button>
        </div>
      </div>
      
      {message && (
        <div className={`p-4 rounded-md ${message.startsWith('Error') || message.startsWith('Exception') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message}
        </div>
      )}
      
      <div className="text-sm text-gray-500">
        <p>Open your browser console to see detailed logs.</p>
      </div>
    </div>
  );
}
