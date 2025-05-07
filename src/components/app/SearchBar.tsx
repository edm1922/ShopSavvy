// src/components/app/SearchBar.tsx
"use client";

import type * as React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function SearchBar({ searchQuery, setSearchQuery, onSearch, isLoading = false }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2 py-4">
      <Input
        type="text"
        placeholder="Search for products (e.g., red shoes, electronics under $50)..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-grow text-base"
        aria-label="Search products"
      />
      <Button type="submit" variant="accent" disabled={isLoading}>
        <Search className="mr-2 h-4 w-4" />
        {isLoading ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
}
