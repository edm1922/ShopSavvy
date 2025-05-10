'use client';

import Link from 'next/link';
import { ShoppingBag, Instagram, Twitter, Facebook, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-indigo-950 text-white relative overflow-hidden">
      {/* Top wave decoration */}
      <div className="absolute top-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto fill-indigo-900 opacity-50">
          <path d="M0,96L48,106.7C96,117,192,139,288,122.7C384,107,480,53,576,53.3C672,53,768,107,864,117.3C960,128,1056,96,1152,80C1248,64,1344,64,1392,64L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      <div className="container px-4 md:px-6 pt-24 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
          <div className="space-y-5">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-pink-400" />
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">ShopSavvy</h3>
            </div>
            <p className="text-indigo-200">
              Your intelligent shopping companion that unifies Shopee, Lazada, and more platforms into one powerful app.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-indigo-300 hover:text-pink-400 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-indigo-300 hover:text-pink-400 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-indigo-300 hover:text-pink-400 transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-indigo-300 hover:text-pink-400 transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-indigo-300 hover:text-pink-400 transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4 text-white">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Features</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Pricing</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Integrations</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Changelog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4 text-white">Company</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Press</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Cookie Policy</Link></li>
              <li><Link href="#" className="text-indigo-200 hover:text-pink-400 transition-colors">Data Protection</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-indigo-900/50 flex flex-col md:flex-row justify-between items-center">
          <p className="text-indigo-300 text-sm">
            © {currentYear} ShopSavvy. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-indigo-300 text-sm">Made with</span> 
              <span className="text-pink-400">♥</span>
              <span className="text-indigo-300 text-sm">in the Philippines</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
