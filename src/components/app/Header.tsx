'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Heart,
  Bell,
  User,
  LogOut,
  Settings,
  BookmarkIcon,
  Image as ImageIcon
} from 'lucide-react';
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

  const navigation = [
    { name: 'Search', href: '/app', icon: Search },
    { name: 'Wishlist', href: '/app/wishlist', icon: Heart },
    { name: 'Notifications', href: '/app/notifications', icon: Bell },
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

      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <a href="/app" className="flex items-center gap-2 text-xl font-semibold">
              <ShoppingBag className="h-7 w-7 text-primary" />
              <span>ShopSavvy</span>
            </a>
            <nav id="main-navigation" className="hidden md:flex items-center gap-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 text-sm font-medium ${
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
              <Link
                href="/app/saved-filters"
                className={`flex items-center gap-2 text-sm font-medium ${
                  pathname === "/app/saved-filters"
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookmarkIcon className="h-4 w-4" />
                Saved Filters
              </Link>
            </nav>
          </div>
        <div className="flex items-center gap-2">
          {/* Currency Selector */}
          <CurrencySelector />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Accessibility Settings */}
          <AccessibilitySettings />

          {/* Keyboard Shortcuts */}
          <KeyboardShortcuts />

          {/* Analytics Dashboard */}
          {user && <AnalyticsDashboard />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarFallback>{getInitials(user.email || '')}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/wishlist" className="flex items-center gap-2 cursor-pointer md:hidden">
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/notifications" className="flex items-center gap-2 cursor-pointer md:hidden">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/saved-filters" className="flex items-center gap-2 cursor-pointer">
                    <BookmarkIcon className="h-4 w-4" />
                    Saved Filters
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {/* Test pages removed as requested */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
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
