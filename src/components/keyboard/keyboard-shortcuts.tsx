'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

interface ShortcutProps {
  keys: string[];
  description: string;
}

const Shortcut = ({ keys, description }: ShortcutProps) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm">{description}</span>
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index} className="px-2 py-1 bg-muted rounded text-xs font-mono">
          {key}
        </span>
      ))}
    </div>
  </div>
);

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts if no input, textarea, or select is focused
      const activeElement = document.activeElement;
      const isInputFocused = 
        activeElement instanceof HTMLInputElement || 
        activeElement instanceof HTMLTextAreaElement || 
        activeElement instanceof HTMLSelectElement;
      
      if (isInputFocused) return;
      
      // Ctrl/Cmd + / to open shortcuts dialog
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen(true);
        return;
      }
      
      // Handle other shortcuts
      switch (e.key) {
        case 'g':
          // Go to search
          e.preventDefault();
          router.push('/app');
          break;
        case 'f':
          // Go to favorites
          e.preventDefault();
          router.push('/app/wishlist');
          break;
        case 'p':
          // Go to profile
          e.preventDefault();
          router.push('/app/profile');
          break;
        case 's':
          // Go to saved filters
          e.preventDefault();
          router.push('/app/saved-filters');
          break;
        case 'Escape':
          // Close dialogs
          setOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" aria-label="Keyboard shortcuts">
            <Keyboard className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to navigate ShopSavvy quickly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-4 divide-y">
            <Shortcut keys={['Ctrl', '/']} description="Open keyboard shortcuts" />
            <Shortcut keys={['g']} description="Go to search page" />
            <Shortcut keys={['f']} description="Go to favorites/wishlist" />
            <Shortcut keys={['p']} description="Go to profile" />
            <Shortcut keys={['s']} description="Go to saved filters" />
            <Shortcut keys={['/']} description="Focus search input" />
            <Shortcut keys={['Esc']} description="Close dialogs" />
            <Shortcut keys={['Tab']} description="Navigate through elements" />
            <Shortcut keys={['Shift', 'Tab']} description="Navigate backwards" />
            <Shortcut keys={['Enter']} description="Activate focused element" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
