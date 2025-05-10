# ShopSavvy: Your Shopping Companion App - Unified Roadmap

## Project Overview
ShopSavvy is a cross-platform shopping companion app that helps users find the best deals across multiple e-commerce platforms, with a focus on Philippine fashion and beauty platforms like Lazada, Zalora, and Shein. The app features an AI assistant powered by Google Gemini, advanced search capabilities using Serper.dev API, price tracking, and personalized recommendations.

## Approach
We're using the Serper.dev API to gather product data from e-commerce platforms:

1. **Serper.dev API Integration**: Our primary method for searching products across platforms
   - Provides reliable access to product data from multiple platforms
   - Handles anti-bot detection and CAPTCHA challenges automatically
   - Offers consistent data format across different platforms

2. **Selective Caching System**: Improves performance and reduces API usage
   - Stores search results in Supabase database for 7 days
   - Implements selective caching to refresh only missing platforms
   - Reduces API calls by reusing cached results when appropriate

This approach allows us to:
1. Focus on building features rather than maintaining scrapers
2. Support multiple Philippine fashion and beauty platforms (Lazada, Zalora, Shein)
3. Provide a more reliable and consistent user experience

## Current State Assessment
The project currently has:
- [x] Next.js application structure with TypeScript and App Router
- [x] UI components using Shadcn/UI and Tailwind CSS
- [x] Serper.dev API integration for product search
- [x] Google Gemini AI assistant integration
- [x] Product display grid with filtering and error handling
- [x] Selective caching system for improved performance
- [x] Support for Lazada, Zalora, and Shein platforms
- [x] Compelling landing page with responsive design
- [x] Authentication system with Supabase
- [x] Database tables for user profiles, saved products, price alerts, and search history
- [x] Middleware for route handling
- [x] Cross-platform product search and comparison
- [x] "COMING SOON" page for mobile app announcement
- [x] Vercel deployment configuration with optimizations

## Roadmap Timeline

### Phase 0: User Interface & Authentication (Week 0)
**Goal**: Create a compelling landing page and implement authentication system

#### Week 0: Landing Page & Authentication
- [x] Design and implement a compelling landing page
  - [x] Create hero section with value proposition
  - [x] Add feature highlights section
  - [x] Include testimonials/use cases section
  - [x] Add call-to-action buttons
  - [x] Implement responsive design
- [x] Set up Supabase client for authentication
  - [x] Configure Supabase project and API keys
  - [x] Implement dual-client approach (anon key and service role key)
  - [x] Add error handling and debugging for authentication
- [x] Create login page with email/password authentication
- [x] Implement registration page for new users
- [x] Add password reset functionality
- [x] Create protected routes for authenticated users
- [x] Add user profile page
- [x] Implement authentication state management
- [x] Create navigation with login/logout functionality
- [x] Set up database tables in Supabase
  - [x] User profiles table with Row Level Security
  - [x] Saved products table for favorites
  - [x] Price alerts table for tracking
  - [x] Search history table for personalization
- [x] Implement middleware for route protection and redirection

### Phase 1: Foundation & Scraping Framework (Completed)
**Goal**: Build the web scraping infrastructure and enhance the existing foundation

#### Week 1: Project Setup & Scraping Framework
- [x] Initialize Next.js project with TypeScript
- [x] Set up UI components with Shadcn/UI
- [x] Create basic page layout and navigation
- [x] Design a unified scraper interface for multiple platforms
- [x] Implement HTTP client with user agent rotation
- [x] Create a rate limiting system to be respectful of target websites
- [x] Implement basic error handling and retry mechanisms
- [x] Set up a proxy rotation system to avoid IP bans
- [x] Set up caching system to reduce repeated requests
- [x] Create logging system for debugging scraper issues
- [x] Research legal considerations for web scraping e-commerce sites
- [x] Define data models for products, users, and platforms
- [x] Set up Supabase backend integration

#### Week 2: Core Scrapers & Search Enhancement
- [x] Implement Shopee scraper module
  - [x] Create search functionality with Playwright browser automation
  - [x] Implement product details scraping with Playwright
  - [x] Add product reviews scraping with Playwright
  - [x] Implement stealth techniques to avoid detection
  - [x] Add screenshot capture for debugging
  - [x] Implement CloudScraper for Cloudflare bypass
- [x] Implement Lazada scraper module
  - [x] Create search functionality with Playwright browser automation
  - [x] Implement product details scraping with Playwright
  - [x] Add product reviews scraping with Playwright
  - [x] Implement stealth techniques to avoid detection
  - [x] Add screenshot capture for debugging
- [x] Implement Temu scraper module
  - [x] Create search functionality with Playwright browser automation
  - [x] Implement stealth techniques to avoid detection
  - [x] Add screenshot capture for debugging
  - [x] Implement CloudScraper for Cloudflare bypass
- [x] Create data normalization layer for consistent product format
- [x] Implement product search functionality via scrapers
- [x] Add product detail scraping capabilities
- [x] Create fallback mechanisms when scraping fails
- [x] Implement basic test suite for scrapers
  - [x] Create test framework for scrapers
  - [x] Implement validation for product data structures
  - [x] Add test scripts for running scraper tests
- [x] Implement advanced search parser for natural language queries
  - [x] Create parser for extracting structured data from natural language
  - [x] Implement price, brand, rating, and platform filters
  - [x] Add sort order extraction
  - [x] Create test suite for the parser
- [x] Create sort functionality (price, ratings, popularity)
- [x] Implement search history tracking in database
- [x] Create unified search API endpoint
  - [x] Implement multi-platform search
  - [x] Add natural language query processing
  - [x] Implement sorting functionality
  - [x] Add search history tracking in database
- [ ] Add filter components (price range, category, brand, rating)
- [ ] Add category browsing interface
- [x] Improve product card design with more details
  - [x] Add error handling for product images
  - [x] Create placeholder images for failed loads
  - [x] Implement image URL validation
  - [x] Add unoptimized image loading for external domains
- [ ] Add pagination or infinite scroll for search results

### Phase 2: Comparison & Search Enhancement (Completed)
**Goal**: Improve search capabilities and implement comparison features

#### Week 3: Search Enhancement
- [x] Replace custom scrapers with Serper.dev API integration
  - [x] Implement Serper.dev API client
  - [x] Create server-only API routes for product operations
  - [x] Add proper error handling and fallbacks
  - [x] Implement selective caching system
- [x] Optimize search performance and reliability
  - [x] Add proper error handling and fallbacks
  - [x] Implement browser/server environment detection
  - [x] Remove mock data in favor of real data only
- [x] Implement search across fashion and beauty platforms
  - [x] Support for Lazada, Zalora, and Shein
  - [x] Implement caching system for search results
  - [x] Normalize data from different platforms
  - [x] Filter results by platform
  - [x] Add error handling and fallback mechanisms
- [x] Implement faceted search with dynamic filters
  - [x] Add price range filters
  - [x] Add platform filters
  - [x] Add brand filters
- [x] Optimize for Vercel deployment
  - [x] Add vercel.json configuration
  - [x] Create .vercelignore file
  - [x] Add deployment scripts
  - [x] Create "COMING SOON" page for mobile app

#### Week 4: Comparison Engine
- [ ] Create comparison view UI
- [ ] Implement side-by-side product comparison
- [ ] Add platform badges and special offer indicators
- [ ] Build basic price history tracking (client-side)
- [ ] Implement shipping cost estimation
- [ ] Add seller rating display when available
- [ ] Create "Best Deal" highlighting

### Phase 3: AI Assistant Enhancement (Current - Weeks 5-6)
**Goal**: Expand AI capabilities for personalized shopping assistance

#### Week 5: AI Model Integration
- [x] Upgrade AI assistant with Google Gemini integration
- [x] Implement basic product recommendation engine
- [x] Create search suggestions based on user queries
- [ ] Enhance personalized search capabilities
- [ ] Add natural language filter parsing
- [ ] Implement query reformulation for better results
- [ ] Add sentiment analysis for product reviews (if available)

#### Week 6: Conversational Shopping
- [ ] Enhance chat interface for AI assistant
- [ ] Implement product Q&A functionality
- [ ] Create guided shopping experiences
- [ ] Add product comparison in conversation
- [ ] Implement purchase advice generation
- [ ] Add voice input for search queries (optional)

### Phase 4: User Accounts & Data Storage (Weeks 7-8)
**Goal**: Implement user accounts and data persistence

#### Week 7: User Account System Enhancement
- [ ] Enhance user profile management with additional fields
- [ ] Implement preferences and settings
- [ ] Add advanced data privacy controls
- [ ] Implement user onboarding flow
- [ ] Add user activity history
- [ ] Implement account deletion functionality

#### Week 8: Wishlist & Collections
- [ ] Build wishlist functionality with Supabase real-time
- [ ] Create product collections/lists in Supabase
- [ ] Implement sharing features
- [ ] Add collaborative wishlists
- [ ] Create "Save for Later" functionality
- [ ] Implement cross-device synchronization

### Phase 5: Price Tracking & Alerts (Weeks 9-10)
**Goal**: Implement server-side price tracking and alerts

#### Week 9: Server-Side Scraping
- [x] Set up Supabase database schema for price history
- [ ] Set up Supabase Edge Functions for scheduled scraping
- [ ] Create background scraping jobs for tracked products
- [ ] Add price history visualization
- [ ] Implement data retention policies
- [ ] Create admin dashboard for monitoring scraper health

#### Week 10: Alerts & Notifications
- [x] Set up database tables for alerts and notifications
- [ ] Implement price drop alerts with Supabase
- [ ] Create deal notifications system
- [ ] Add back-in-stock alerts
- [ ] Implement browser push notifications
- [ ] Create email notification system
- [ ] Add notification preferences

### Phase 6: Mobile & Offline Capabilities (Weeks 11-12)
**Goal**: Optimize for mobile and add offline functionality

#### Week 11: Mobile Optimization
- [ ] Optimize UI for mobile devices
- [ ] Implement responsive design improvements
- [ ] Add mobile-specific features
- [ ] Create native app feel on mobile web
- [ ] Implement touch gestures
- [ ] Optimize performance for mobile networks

#### Week 12: Progressive Web App
- [ ] Configure service workers
- [ ] Implement app manifest
- [ ] Add install prompts
- [ ] Create offline fallbacks
- [ ] Implement push notifications
- [ ] Add app shortcuts

### Phase 7: Testing & Launch (Weeks 13-14)
**Goal**: Comprehensive testing and preparation for launch

#### Week 13: Testing
- [ ] Implement unit tests for core functionality
- [ ] Create integration tests for scrapers
- [ ] Perform usability testing
- [ ] Conduct cross-browser testing
- [ ] Implement accessibility testing
- [ ] Perform security audit

#### Week 14: Launch Preparation
- [ ] Update and refine marketing landing page
- [ ] Prepare app store listings (if applicable)
- [ ] Implement user onboarding tutorials
- [ ] Create documentation
- [ ] Set up support channels
- [ ] Prepare launch announcements

## Future Enhancements (Post-Launch)
- Social shopping features
- AR product visualization
- Sustainable shopping indicators
- Local store inventory integration
- Deal prediction algorithm
- Shopping assistant browser extension

## Technology Stack
| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| Frontend     | Next.js, React, TypeScript, Tailwind CSS, Shadcn/UI       |
| Backend      | Supabase (Auth, Database, Storage, Edge Functions)        |
| Authentication| Supabase Auth with dual-client approach (anon + service role)|
| AI Assistant | Google Gemini API with Genkit                             |
| Data Source  | Serper.dev API with selective caching                     |
| Search       | Serper.dev Shopping API with platform filtering           |
| Database     | Supabase PostgreSQL with Row Level Security               |
| DevOps       | GitHub Actions, Vercel deployment                         |
| Analytics    | Google Analytics, Supabase Analytics                      |

## Success Metrics
- User engagement (time spent, searches performed)
- Cross-platform comparisons made
- Money saved through price tracking
- AI assistant interactions
- User retention and growth
- Wishlist conversion rate

## Challenges & Mitigations
| Challenge                                | Mitigation                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Search result consistency                | Use standardized data models and normalization for consistent results                     |
| API rate limiting                        | Implement selective caching to reduce API calls and optimize usage                        |
| API cost management                      | Cache results for 7 days and implement selective refreshing for specific platforms        |
| Performance concerns                     | Use efficient caching and implement pagination for large result sets                      |
| Platform coverage                        | Focus on key Philippine fashion platforms (Lazada, Zalora, Shein)                         |
| Cross-platform data normalization        | Create a standardized product model with consistent fields across platforms               |
| Authentication security                  | Use dual-client approach with appropriate permissions for different operations            |
| Database security                        | Implement Row Level Security (RLS) policies for all tables                                |
| AI assistant accuracy                    | Use Google Gemini API with well-crafted prompts for better results                        |
| Mobile performance                       | Optimize bundle size, implement code splitting, and use efficient rendering techniques    |
| Search result relevance                  | Implement platform-specific filtering and sorting to improve result quality               |
| Deployment optimization                  | Use Vercel configuration and exclude test files for production deployment                 |
