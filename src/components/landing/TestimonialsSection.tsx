'use client';

import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "ShopSavvy saved me ₱3,450 on my new laptop by comparing prices across multiple platforms. The AI suggestions were spot on!",
    author: "Miguel Santos",
    role: "Tech Enthusiast",
    rating: 5,
    avatar: "MS",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop"
  },
  {
    quote: "The price tracking is a game-changer! Got alerted about a flash sale on my wishlist items and saved 40% on my purchase.",
    author: "Sophia Garcia",
    role: "Smart Shopper",
    rating: 5,
    avatar: "SG",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop"
  },
  {
    quote: "ShopSavvy's AI recommended the perfect laptop for my needs and budget. Comparing specs across platforms made decision-making easy.",
    author: "Joshua Reyes",
    role: "College Student",
    rating: 4,
    avatar: "JR",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=687&auto=format&fit=crop"
  }
];

const TestimonialsSection = () => {
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
    <section id="testimonials" className="py-24 bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-950 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-indigo-500/10 blur-[100px]"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="px-4 py-1.5 rounded-full bg-indigo-900/50 border border-indigo-700/50 text-indigo-300 text-sm font-medium inline-block mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Loved by Smart Shoppers <span className="text-purple-400">Worldwide</span>
          </h2>
          <p className="text-indigo-200 text-lg">
            Join thousands of satisfied users who are saving money and making smarter purchasing decisions.
          </p>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="bg-white/10 backdrop-blur-md border-white/10 overflow-hidden h-full relative group hover:bg-white/15 transition-colors duration-300">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                    {[...Array(5 - testimonial.rating)].map((_, i) => (
                      <Star key={i + testimonial.rating} className="h-5 w-5 fill-transparent text-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-white mb-8 text-lg flex-grow">{testimonial.quote}</p>
                  
                  <div className="flex items-center mt-auto">
                    <Avatar className="h-12 w-12 mr-4 border-2 border-purple-500">
                      <AvatarImage src={testimonial.image} alt={testimonial.author} className="object-cover" />
                      <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">{testimonial.author}</p>
                      <p className="text-indigo-300 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center justify-center gap-1 text-indigo-300">
            <span className="text-xl font-semibold">4.8</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span>from 2,000+ reviews</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
