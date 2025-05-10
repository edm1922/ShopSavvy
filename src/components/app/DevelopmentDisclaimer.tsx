'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DevelopmentDisclaimerProps {
  className?: string;
}

export function DevelopmentDisclaimer({ className = '' }: DevelopmentDisclaimerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className={`bg-amber-500/20 border border-amber-500/40 rounded-lg p-4 mb-6 backdrop-blur-md ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-400">Development Version</h3>
          <p className="text-sm text-white/90 mt-1">
            ShopSavvy is currently in active development. Some features may be incomplete or not fully functional.
            We're working hard to improve the app and appreciate your patience and feedback.
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 -mt-1 -mr-2"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
