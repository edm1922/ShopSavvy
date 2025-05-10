'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-r from-indigo-950 to-purple-950 text-white">
      {/* Abstract gradient shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[400px] -left-[300px] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[100px]"></div>
        <div className="absolute top-[100px] -right-[300px] w-[600px] h-[600px] rounded-full bg-blue-700/20 blur-[100px]"></div>
        <div className="absolute -bottom-[400px] left-[30%] w-[800px] h-[800px] rounded-full bg-pink-700/20 blur-[100px]"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full border border-purple-500/50 bg-purple-900/50 backdrop-blur-sm"
            >
              <ShoppingBag className="h-4 w-4 text-pink-400" />
              <span className="text-sm font-medium text-pink-300">Revolutionary Shopping Experience</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl md:text-6xl xl:text-7xl font-bold leading-tight"
            >
              Shop Smarter with <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 bg-clip-text text-transparent">AI-Powered</span> Price Comparison
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-lg text-purple-200 md:text-xl max-w-xl"
            >
              Your ultimate shopping companion that unifies Shopee, Lazada, and more into one intelligent interface. Find the best deals without switching apps.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/coming-soon">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 px-8 text-lg h-14">
                  Download App
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="border-purple-500 text-purple-200 hover:bg-purple-900/30 h-14 group bg-transparent">
                  <span>How It Works</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="pt-4 flex flex-col sm:flex-row gap-6"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-pink-400" />
                <span className="text-purple-200">100+ Online Stores</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-pink-400" />
                <span className="text-purple-200">10M+ Products</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-pink-400" />
                <span className="text-purple-200">Advanced AI</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative z-10 mockup-container">
              <motion.div
                className="mockup-phone"
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="phone-screen rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-gray-800 relative">
                  <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-t-lg z-20"></div>
                  <img
                    src="https://images.unsplash.com/photo-1598971639058-afc1f1c94856?auto=format&fit=crop&q=80"
                    alt="ShopSavvy App Screenshot"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
                  <div className="absolute bottom-8 left-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70">Best price found</p>
                        <p className="text-xl font-bold text-white">₱1,299.00</p>
                      </div>
                      <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white" onClick={() => window.location.href = '/register'}>
                        View Deal
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-1/2 -right-20 transform -translate-y-1/2 w-40 h-40 bg-pink-600/30 rounded-full blur-[60px] z-0"></div>
            <div className="absolute bottom-10 -left-10 w-32 h-32 bg-purple-600/20 rounded-full blur-[50px] z-0"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
