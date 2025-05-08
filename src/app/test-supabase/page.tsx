'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Testing Supabase connection...');
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      try {
        // Test the connection by getting the session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase connection error:', error);
          setStatus('error');
          setMessage(`Connection error: ${error.message}`);
          return;
        }
        
        console.log('Supabase connection successful!');
        setStatus('success');
        setMessage('Connection successful!');
        setSession(data.session);
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setStatus('error');
        setMessage(`Unexpected error: ${err.message}`);
      }
    }
    
    checkConnection();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        setMessage(`Sign in error: ${error.message}`);
      } else {
        console.log('Sign in successful!', data);
        setMessage('Sign in successful!');
        setSession(data.session);
      }
    } catch (err: any) {
      console.error('Sign in exception:', err);
      setMessage(`Sign in exception: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        setMessage(`Sign out error: ${error.message}`);
      } else {
        console.log('Sign out successful!');
        setMessage('Sign out successful!');
        setSession(null);
      }
    } catch (err: any) {
      console.error('Sign out exception:', err);
      setMessage(`Sign out exception: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className={`p-4 rounded-lg mb-6 ${
        status === 'loading' ? 'bg-yellow-100' :
        status === 'success' ? 'bg-green-100' :
        'bg-red-100'
      }`}>
        <p className="font-medium">{message}</p>
      </div>
      
      {session ? (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Active Session</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p><strong>User ID:</strong> {session.user.id}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Expires At:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
          </div>
          
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSignIn} className="mb-6 max-w-md">
          <h2 className="text-xl font-semibold mb-2">Sign In Test</h2>
          
          <div className="mb-4">
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      )}
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Supabase Client Info</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Using fallback URL'}</p>
          <p><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set from environment' : 'Using fallback key'}</p>
        </div>
      </div>
    </div>
  );
}
