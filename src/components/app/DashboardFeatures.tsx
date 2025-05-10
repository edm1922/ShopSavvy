'use client';

import { 
  Search, 
  MessageSquare, 
  ShoppingBag, 
  Filter, 
  Sparkles, 
  BarChart3, 
  Smartphone,
  Compass
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkHref?: string;
  linkText?: string;
}

export function FeatureCard({ icon, title, description, linkHref, linkText }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-indigo-900/50 backdrop-blur-sm border border-purple-500/30 p-6 hover:bg-indigo-800/50 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
      <div className="p-4 backdrop-blur-sm rounded-full bg-indigo-800/50 inline-flex mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
      <p className="text-purple-200 text-sm mb-4">{description}</p>
      {linkHref && linkText && (
        <Link href={linkHref}>
          <Button variant="link" className="p-0 h-auto text-pink-400 hover:text-pink-300">
            {linkText}
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function DashboardFeatures() {
  const features = [
    {
      icon: <Compass className="h-6 w-6 text-pink-400" />,
      title: "Cross-Platform Search",
      description: "Compare prices across Lazada, Zalora, and Shein to find the best deals on your favorite products.",
      linkHref: "/app",
      linkText: "Search now"
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-pink-400" />,
      title: "AI Shopping Assistant",
      description: "Get personalized recommendations and shopping advice from our AI-powered assistant.",
      linkHref: "/app",
      linkText: "Ask assistant"
    },
    {
      icon: <ShoppingBag className="h-6 w-6 text-pink-400" />,
      title: "Unified Shopping",
      description: "View and compare products from multiple platforms in one unified interface.",
      linkHref: "/app",
      linkText: "Start shopping"
    },
    {
      icon: <Filter className="h-6 w-6 text-pink-400" />,
      title: "Advanced Filters",
      description: "Filter products by price, platform, brand, and more to find exactly what you're looking for.",
      linkHref: "/app/saved-filters",
      linkText: "Try filters"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          linkHref={feature.linkHref}
          linkText={feature.linkText}
        />
      ))}
    </div>
  );
}
