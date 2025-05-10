'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
          Coming Soon
        </h1>
        
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 mb-8">
          <p className="text-xl mb-6">
            The ShopSavvy mobile app is currently in development and will be available soon.
          </p>
          
          <p className="text-indigo-200 mb-8">
            We're working hard to bring you the best shopping companion app for your mobile device. 
            Stay tuned for updates!
          </p>
          
          <div className="flex justify-center">
            <Link href="/">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
