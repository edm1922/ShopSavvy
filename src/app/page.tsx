// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  Search,
  TrendingUp,
  Bell,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold">
            <ShoppingBag className="h-7 w-7 text-primary" />
            <span>ShopSavvy</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">
              App
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-background to-muted py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Find the <span className="text-primary">Best Deals</span> Across All Platforms
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              ShopSavvy helps you compare prices, track deals, and save money with our AI-powered shopping assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/app">
                <Button size="lg" variant="outline">
                  Try the App
                </Button>
              </Link>
            </div>
            <div className="relative h-[300px] md:h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-xl mx-auto max-w-5xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
              <div className="text-center p-8">
                <ShoppingBag className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">ShopSavvy App</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Compare prices across multiple platforms and find the best deals with our AI-powered shopping assistant.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">Why Choose ShopSavvy?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <FeatureCard
                icon={<Search className="h-8 w-8 text-primary" />}
                title="Cross-Platform Comparison"
                description="Compare prices across multiple e-commerce platforms like Shopee and Lazada to find the best deals."
              />
              <FeatureCard
                icon={<Sparkles className="h-8 w-8 text-primary" />}
                title="AI Shopping Assistant"
                description="Get personalized recommendations and shopping advice from our AI-powered assistant."
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8 text-primary" />}
                title="Price Tracking"
                description="Track price history and get alerts when prices drop on your favorite products."
              />
              <FeatureCard
                icon={<Bell className="h-8 w-8 text-primary" />}
                title="Deal Alerts"
                description="Receive notifications for special offers, discounts, and limited-time deals."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-8 w-8 text-primary" />}
                title="Trusted Reviews"
                description="Access authentic reviews and ratings to make informed purchasing decisions."
              />
              <FeatureCard
                icon={<Smartphone className="h-8 w-8 text-primary" />}
                title="Mobile Friendly"
                description="Use ShopSavvy on any device with our responsive, mobile-friendly design."
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">What Our Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <TestimonialCard
                quote="ShopSavvy helped me save over $200 on my recent electronics purchase by finding a deal I would have missed!"
                author="Sarah K."
                role="Tech Enthusiast"
              />
              <TestimonialCard
                quote="The price tracking feature is amazing. I got notified when my wishlist items went on sale and saved big!"
                author="Michael T."
                role="Smart Shopper"
              />
              <TestimonialCard
                quote="I love how the AI assistant helps me find exactly what I'm looking for across different platforms."
                author="Jessica L."
                role="Busy Parent"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Saving?</h2>
            <p className="text-xl max-w-2xl mx-auto mb-10">
              Join thousands of smart shoppers who use ShopSavvy to find the best deals and save money on every purchase.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">ShopSavvy</span>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground">About</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/contact" className="hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ShopSavvy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <p className="italic mb-4">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}
