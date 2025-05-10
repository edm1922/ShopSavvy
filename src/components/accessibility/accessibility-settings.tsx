'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getUserPreferences, saveUserPreferences } from '@/services/user-preferences';
import { Accessibility } from 'lucide-react';

export function AccessibilitySettings() {
  const [settings, setSettings] = useState({
    highContrast: false,
    reducedMotion: false,
    largeText: false,
  });
  const [open, setOpen] = useState(false);

  // Load settings from user preferences
  useEffect(() => {
    const userPreferences = getUserPreferences();
    setSettings(userPreferences.accessibility);
  }, [open]);

  // Apply accessibility settings to the document
  useEffect(() => {
    const root = document.documentElement;

    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
  }, [settings]);

  // Save settings to user preferences
  const saveSettings = () => {
    saveUserPreferences({
      accessibility: settings,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md text-pink-400 hover:text-pink-300 hover:bg-purple-800/50" aria-label="Accessibility settings">
          <Accessibility className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-indigo-950 border border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-pink-400">Accessibility Settings</DialogTitle>
          <DialogDescription className="text-purple-200">
            Customize your experience to make the app more accessible.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast" className="text-white">High Contrast</Label>
              <p className="text-sm text-purple-200">
                Increases contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, highContrast: checked })
              }
              className="data-[state=checked]:bg-pink-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduced-motion" className="text-white">Reduced Motion</Label>
              <p className="text-sm text-purple-200">
                Minimizes animations and transitions
              </p>
            </div>
            <Switch
              id="reduced-motion"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, reducedMotion: checked })
              }
              className="data-[state=checked]:bg-pink-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="large-text" className="text-white">Large Text</Label>
              <p className="text-sm text-purple-200">
                Increases text size for better readability
              </p>
            </div>
            <Switch
              id="large-text"
              checked={settings.largeText}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, largeText: checked })
              }
              className="data-[state=checked]:bg-pink-500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={saveSettings}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
