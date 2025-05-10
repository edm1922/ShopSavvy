'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Heart,
  User,
  LogOut,
  Settings,
  BookmarkIcon,
  Image as ImageIcon,
  Bell
} from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useAuth } from '@/contexts/auth-context';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { AccessibilitySettings } from '@/components/accessibility/accessibility-settings';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { KeyboardShortcuts } from '@/components/keyboard/keyboard-shortcuts';
import { SkipLink } from '@/components/accessibility/skip-link';
import { CurrencySelector } from '@/components/app/CurrencySelector';

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Navigation items
  const navigation: { name: string; href: string; icon: any }[] = [
    { name: 'Price Alerts', href: '/app/price-alerts', icon: Bell }
  ];

  // Add a test link for developers
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div>
      {/* Skip Links for keyboard accessibility */}
      <SkipLink
        links={[
          { id: 'main-content', label: 'Skip to main content' },
          { id: 'main-navigation', label: 'Skip to navigation' },
          { id: 'search-input', label: 'Skip to search' },
        ]}
      />

      <header className="border-b border-purple-800/30 bg-indigo-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <a href="/app" className="flex items-center gap-2 text-xl font-semibold group">
              <ShoppingBag className="h-7 w-7 text-pink-400 group-hover:text-pink-300 transition-colors" />
              <span className="text-white">ShopSavvy</span>
            </a>
            <nav id="main-navigation" className="hidden md:flex items-center gap-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'text-pink-400'
                        : 'text-purple-200 hover:text-pink-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-pink-400' : 'text-purple-300'}`} />
                    {item.name}
                  </Link>
                );
              })}

            </nav>
          </div>
        <div className="flex items-center gap-2">
          {/* Currency Selector */}
          <CurrencySelector />

          {/* Accessibility Settings */}
          <AccessibilitySettings />

          {/* Notifications Dropdown */}
          {user && <NotificationsDropdown />}

          {/* Analytics Dashboard */}
          {user && <AnalyticsDashboard />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full border border-pink-500/30 bg-indigo-950/50 hover:bg-indigo-900/80">
                  <Avatar className="ring-2 ring-pink-500/50">
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold">
                      {getInitials(user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-indigo-950 border border-pink-500/30 shadow-lg shadow-pink-500/10">
                <DropdownMenuLabel className="text-pink-400">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-purple-800/50" />
                <DropdownMenuItem asChild>
                  <Link href="/app/profile" className="flex items-center gap-2 cursor-pointer text-purple-200 hover:text-pink-300 focus:text-pink-300 focus:bg-indigo-900">
                    <User className="h-4 w-4 text-pink-400" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/app/settings" className="flex items-center gap-2 cursor-pointer text-purple-200 hover:text-pink-300 focus:text-pink-300 focus:bg-indigo-900">
                    <Settings className="h-4 w-4 text-pink-400" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-800/50" />
                <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-indigo-900">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-pink-500/50 text-purple-200 hover:bg-pink-500/10 hover:text-pink-300">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
    </div>
  );
}
