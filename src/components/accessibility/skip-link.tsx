'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface SkipLinkProps {
  links?: Array<{
    id: string;
    label: string;
  }>;
}

/**
 * SkipLink component for keyboard accessibility
 * Allows keyboard users to skip to main content areas
 */
export function SkipLink({ links = [] }: SkipLinkProps) {
  const [visible, setVisible] = useState(false);

  // Default links if none provided
  const defaultLinks = [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'main-navigation', label: 'Skip to navigation' },
    { id: 'search', label: 'Skip to search' },
  ];

  const skipLinks = links.length > 0 ? links : defaultLinks;

  // Handle keyboard focus to show/hide skip links
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey && !visible) {
        setVisible(true);
      } else if (e.key === 'Escape' && visible) {
        setVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible]);

  // Handle click on skip link
  const handleSkip = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Set tabindex to make the element focusable
      element.setAttribute('tabindex', '-1');
      element.focus();
      
      // Remove tabindex after blur
      element.addEventListener('blur', () => {
        element.removeAttribute('tabindex');
      }, { once: true });
      
      // Scroll to the element
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 z-50 w-full bg-background border-b p-2 flex items-center justify-center gap-2 shadow-md">
      {skipLinks.map((link) => (
        <Button
          key={link.id}
          variant="outline"
          onClick={() => handleSkip(link.id)}
          className="focus:ring-2 focus:ring-primary"
        >
          {link.label}
        </Button>
      ))}
    </div>
  );
}
