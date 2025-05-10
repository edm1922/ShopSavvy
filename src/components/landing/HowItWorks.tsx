'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

const steps = [
  {
    number: "01",
    title: "Install ShopSavvy",
    description: "Download the app from App Store or Google Play and create your account in seconds.",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1470&auto=format&fit=crop"
  },
  {
    number: "02",
    title: "Search Across Platforms",
    description: "Enter what you're looking for and instantly see results from Shopee, Lazada, and more.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1470&auto=format&fit=crop"
  },
  {
    number: "03",
    title: "Compare & Track Prices",
    description: "See price history charts and set alerts for when products drop to your target price.",
    image: "https://images.unsplash.com/photo-1553729784-e91953dec042?q=80&w=1470&auto=format&fit=crop"
  },
  {
    number: "04",
    title: "Get AI Recommendations",
    description: "Receive personalized product suggestions based on your preferences and behavior.",
    image: "https://images.unsplash.com/photo-1555421689-3f034debb7a6?q=80&w=1470&auto=format&fit=crop"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-100 rounded-full opacity-50 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-purple-100 rounded-full opacity-50 blur-3xl"></div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-sm font-medium inline-block mb-4"
          >
            Simple Steps
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-900 to-purple-800 bg-clip-text text-transparent"
          >
            How ShopSavvy Transforms Your Shopping
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-gray-600 text-lg"
          >
            Follow these simple steps to revolutionize your shopping experience and start saving money today.
          </motion.p>
        </div>
        
        <div className="space-y-24">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 0 ? '' : 'lg:flex-row-reverse'
              }`}
            >
              <div className={`order-2 ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                <div className="relative">
                  <span className="text-6xl md:text-8xl font-bold text-indigo-900/10 absolute -top-10 -left-4">
                    {step.number}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-indigo-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 text-lg mb-6">
                    {step.description}
                  </p>
                  {index === steps.length - 1 && (
                    <Link href="/register">
                      <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                        Get Started Now
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <div className={`order-1 ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20 blur-lg"></div>
                  <div className="relative overflow-hidden rounded-xl border border-indigo-200 shadow-xl">
                    <img 
                      src={step.image} 
                      alt={step.title} 
                      className="w-full h-[300px] object-cover"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
