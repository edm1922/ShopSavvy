'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingBag, Star, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CTASection = () => {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    // Here you would typically send the email to your backend
    toast({
      title: "Success!",
      description: "You've been added to our waitlist. We'll notify you when we launch!",
    });
    
    setEmail('');
  };

  return (
    <section className="py-24 bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1557682250-f4b38c6f9ebb?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-5"></div>
        <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[100px]"></div>
        <div className="absolute -bottom-[300px] -left-[300px] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[100px]"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl font-bold mb-6 text-white"
              >
                Ready to Shop <span className="text-pink-400">Smarter?</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-indigo-200 text-lg mb-8"
              >
                Join our community of smart shoppers and start saving on your online purchases today. Get early access to exclusive features and deals.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-5"
              >
                <div className="flex items-center bg-white/10 backdrop-blur-md p-4 rounded-lg">
                  <div className="bg-pink-500/20 p-2 rounded-full mr-3">
                    <ShoppingBag className="h-5 w-5 text-pink-400" />
                  </div>
                  <p className="text-white">Access to Shopee, Lazada, and 100+ more platforms</p>
                </div>
                
                <div className="flex items-center bg-white/10 backdrop-blur-md p-4 rounded-lg">
                  <div className="bg-pink-500/20 p-2 rounded-full mr-3">
                    <Star className="h-5 w-5 text-pink-400" />
                  </div>
                  <p className="text-white">AI-powered recommendations tailored to you</p>
                </div>
                
                <div className="flex items-center bg-white/10 backdrop-blur-md p-4 rounded-lg">
                  <div className="bg-pink-500/20 p-2 rounded-full mr-3">
                    <Shield className="h-5 w-5 text-pink-400" />
                  </div>
                  <p className="text-white">Secure and private shopping experience</p>
                </div>
                
                <div className="flex items-center bg-white/10 backdrop-blur-md p-4 rounded-lg">
                  <div className="bg-pink-500/20 p-2 rounded-full mr-3">
                    <Sparkles className="h-5 w-5 text-pink-400" />
                  </div>
                  <p className="text-white">Exclusive deals and promotions</p>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 blur-md opacity-50"></div>
              <div className="relative bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20">
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">Get Early Access</h3>
                  <p className="text-indigo-200">Be among the first to experience ShopSavvy</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm text-indigo-200">Email Address</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-indigo-300/50 h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 h-12">
                    <span>Join the Waitlist</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-indigo-300 text-sm">Already have an account?</p>
                  <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium text-sm">
                    Sign in here
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
