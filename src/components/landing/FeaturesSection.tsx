'use client';

import { Search, TrendingDown, Heart, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: <Search className="h-12 w-12 text-white" />,
    title: "Smart Price Comparison",
    description: "Instantly compare prices across Shopee, Lazada, and other platforms to find the best deals available."
  },
  {
    icon: <MessageSquare className="h-12 w-12 text-white" />,
    title: "AI Shopping Assistant",
    description: "Get personalized shopping advice and product recommendations powered by advanced AI."
  },
  {
    icon: <TrendingDown className="h-12 w-12 text-white" />,
    title: "Price History & Alerts",
    description: "Track price history and receive alerts when your favorite products drop in price."
  },
  {
    icon: <Heart className="h-12 w-12 text-white" />,
    title: "Wishlist Management",
    description: "Save your favorite items across multiple platforms in one unified wishlist."
  }
];

const FeaturesSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section id="features" className="py-24 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300"
          >
            One App. All Shopping Powers.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-purple-100 text-xl"
          >
            ShopSavvy unifies your shopping experience across multiple platforms with intelligent features.
          </motion.p>
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 hover:bg-white/20 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              <div className="p-4 backdrop-blur-sm rounded-full bg-white/5 inline-flex mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-purple-100">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link href="/app">
            <Button className="bg-white text-indigo-900 hover:bg-white/90 px-8 py-6 text-lg rounded-full group">
              <span>Explore All Features</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
