// src/components/app/Header.tsx
import { PackageSearch } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold">
          <PackageSearch className="h-7 w-7 text-primary" />
          <span>ShopSavvy</span>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}
