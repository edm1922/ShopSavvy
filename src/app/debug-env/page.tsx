'use client';

import { useEffect, useState } from 'react';

export default function DebugEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Collect all NEXT_PUBLIC_ environment variables
    const vars: Record<string, string> = {};
    
    // Check for Supabase variables
    vars['NEXT_PUBLIC_SUPABASE_URL'] = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET';
    vars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` 
      : 'NOT SET';
    
    // Add other public env vars
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_') && !vars[key]) {
        vars[key] = typeof process.env[key] === 'string' 
          ? process.env[key] as string 
          : 'INVALID TYPE';
      }
    });
    
    setEnvVars(vars);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Client-Side Environment Variables</h2>
        
        <div className="space-y-2">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <span className="font-medium">{key}:</span>
              <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                {value}
              </code>
            </div>
          ))}
        </div>
        
        {Object.keys(envVars).length === 0 && (
          <p className="text-red-500">No environment variables found!</p>
        )}
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Make sure your <code>.env.local</code> file exists in the project root</li>
          <li>Verify that environment variables are prefixed with <code>NEXT_PUBLIC_</code> for client-side use</li>
          <li>Restart the development server after changing environment variables</li>
          <li>Check for typos in variable names</li>
        </ul>
      </div>
    </div>
  );
}
