'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface PhoneMockupProps {
  price?: number;
  productUrl?: string;
  imageUrl?: string;
  backgroundColor?: string;
}

export function PhoneMockup({
  price = 1299.00,
  productUrl = '#',
  imageUrl = "https://images.unsplash.com/photo-1598971639058-afc1f1c94856?auto=format&fit=crop&q=80",
  backgroundColor = 'bg-purple-900'
}: PhoneMockupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="relative"
    >
      <div className="relative z-10 mockup-container">
        <div className="mockup-phone">
          <div className="phone-screen rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-gray-800 relative">
            <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-t-lg z-20"></div>
            <img
              src={imageUrl}
              alt="ShopSavvy App Screenshot"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70">Best price found</p>
                  <p className="text-xl font-bold text-white">₱{price.toFixed(2)}</p>
                </div>
                <Link href={productUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white">
                    View Deal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 -right-8 w-16 h-16 bg-pink-500 rounded-full blur-xl opacity-40"></div>
      <div className="absolute -bottom-8 right-1/3 w-20 h-20 bg-blue-500 rounded-full blur-xl opacity-40"></div>
    </motion.div>
  );
}
