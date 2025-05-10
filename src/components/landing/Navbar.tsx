'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full py-3 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-indigo-950/80 backdrop-blur-lg shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="container px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 z-20">
          <ShoppingBag className="h-8 w-8 text-pink-400" />
          <div className="text-2xl font-bold text-white">ShopSavvy</div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-white/80 hover:text-pink-400 transition-colors font-medium">Home</Link>
          <Link href="#features" className="text-white/80 hover:text-pink-400 transition-colors font-medium">Features</Link>
          <Link href="#how-it-works" className="text-white/80 hover:text-pink-400 transition-colors font-medium">How It Works</Link>
          <Link href="#testimonials" className="text-white/80 hover:text-pink-400 transition-colors font-medium">Testimonials</Link>
        </div>

        {/* Call to Action Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
              Sign Up
            </Button>
          </Link>
          <Link href="/coming-soon">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0">
              Download App
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden z-20 text-white"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "100vh" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 top-0 z-10 flex flex-col bg-indigo-950 pt-20"
            >
              <div className="container px-4 flex flex-col space-y-8 py-10">
                <Link
                  href="/"
                  className="text-white text-2xl font-medium"
                  onClick={toggleMenu}
                >
                  Home
                </Link>
                <Link
                  href="#features"
                  className="text-white text-2xl font-medium"
                  onClick={toggleMenu}
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-white text-2xl font-medium"
                  onClick={toggleMenu}
                >
                  How It Works
                </Link>
                <Link
                  href="#testimonials"
                  className="text-white text-2xl font-medium"
                  onClick={toggleMenu}
                >
                  Testimonials
                </Link>
                <div className="flex flex-col space-y-4 mt-8">
                  <Link href="/login" onClick={toggleMenu}>
                    <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 w-full py-6 text-lg">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={toggleMenu}>
                    <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 w-full py-6 text-lg">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/coming-soon" onClick={toggleMenu}>
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white w-full py-6 text-lg">
                      Download App
                    </Button>
                  </Link>
                </div>
              </div>
              {/* Decorative gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-800/30 to-transparent"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
