# ShopSavvy: Your Shopping Companion App - Unified Roadmap

## Project Overview
ShopSavvy is a cross-platform shopping companion app that helps users find the best deals across multiple e-commerce platforms, with a focus on local platforms like Shopee and Lazada. The app features an AI assistant, advanced search capabilities, price tracking, and personalized recommendations.

## Approach
We're using a hybrid approach to gather product data from e-commerce platforms:

1. **Serper.dev API**: Our primary method for searching products across multiple platforms
   - Provides access to Google Shopping results without triggering CAPTCHAs
   - Supports a wide range of e-commerce platforms
   - Offers consistent data format and reliable results

2. **Web Scraping (Fallback)**: Used as a fallback for specific platforms when needed
   - Allows for more detailed product information
   - Provides access to platform-specific features
   - Used for price tracking and detailed product pages

This hybrid approach allows us to:
1. Move forward with development without waiting for API approvals
2. Support a wide range of platforms (60+ e-commerce sites)
3. Have reliable search results while avoiding anti-scraping measures

## Current State Assessment
The project currently has:
- [x] Basic Next.js application structure with TypeScript
- [x] UI components using Shadcn/UI and Tailwind CSS
- [x] Universal search functionality using Serper.dev API
- [x] Basic AI assistant integration with Google Gemini
- [x] Product display grid with error handling
- [x] Web scraping architecture design
- [x] Support for multiple e-commerce platforms
- [x] Compelling landing page with responsive design
- [x] Authentication system with Supabase
- [x] Database tables for user profiles, saved products, price alerts, and search history
- [x] Middleware for route handling
- [x] Cross-platform product search and comparison

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
- [ ] Set up a proxy rotation system to avoid IP bans
- [x] Set up caching system to reduce repeated requests
- [ ] Create logging system for debugging scraper issues
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
- [x] Implement Lazada scraper module
  - [x] Create search functionality with Playwright browser automation
  - [x] Implement product details scraping with Playwright
  - [x] Add product reviews scraping with Playwright
  - [x] Implement stealth techniques to avoid detection
  - [x] Add screenshot capture for debugging
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

### Phase 2: Comparison & Search Enhancement (Current)
**Goal**: Improve search capabilities and implement comparison features

#### Week 3: Search Enhancement
- [x] Refine scrapers based on testing feedback
  - [x] Create browser-safe scraper factory
  - [x] Implement server-only API routes for product operations
  - [x] Add fallbacks for Node.js built-in modules
  - [x] Create dynamic Playwright loader
- [x] Optimize search performance and reliability
  - [x] Add proper error handling and fallbacks
  - [x] Implement browser/server environment detection
  - [x] Remove mock data in favor of real data only
- [x] Implement universal search across multiple marketplaces
  - [x] Integrate Serper.dev API for Google Shopping results
  - [x] Support a wide range of e-commerce platforms (60+ e-commerce sites)
  - [x] Normalize data from different sources
  - [x] Filter results by platform
  - [x] Evaluate alternative APIs (DuckDuckGo) and select Serper.dev as the best option
- [ ] Implement faceted search with dynamic filters
- [ ] Add "Similar Products" functionality
- [ ] Create "Best Deal" highlighting
- [ ] Implement search result clustering by category/type
- [ ] Add product image gallery view
- [ ] Implement product variant selection

#### Week 4: Comparison Engine
- [ ] Create comparison view UI
- [ ] Implement side-by-side product comparison
- [ ] Add platform badges and special offer indicators
- [ ] Build basic price history tracking (client-side)
- [ ] Implement shipping cost estimation
- [ ] Add seller rating display when available
- [ ] Create "Best Deal" highlighting

### Phase 3: AI Assistant Enhancement (Weeks 5-6)
**Goal**: Expand AI capabilities for personalized shopping assistance

#### Week 5: AI Model Integration
- [ ] Upgrade AI assistant with more advanced prompts
- [ ] Implement product recommendation engine
- [ ] Create personalized search enhancement
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
| AI Assistant | Google Gemini API, Genkit                                 |
| Data Source  | Serper.dev API (primary), Web scraping with Playwright (fallback) |
| Search       | Google Shopping via Serper.dev API (evaluated DuckDuckGo but found Serper.dev superior) |
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
| Search result consistency                | Use Serper.dev API as primary data source with standardized response format               |
| Limited product details from API         | Implement fallback to direct scraping for detailed product pages when needed              |
| API rate limits and costs                | Implement caching, optimize API calls, and consider tiered subscription plans             |
| Platform coverage gaps                   | Support 60+ e-commerce platforms through Google Shopping results                          |
| Cross-platform data normalization        | Create a standardized product model with flexible mappers for each platform               |
| Authentication security                  | Use dual-client approach with appropriate permissions for different operations            |
| Database security                        | Implement Row Level Security (RLS) policies for all tables                                |
| AI assistant accuracy                    | Continuously train and refine the model with user feedback                                |
| Mobile performance                       | Optimize bundle size, implement code splitting, and use efficient rendering techniques    |
| Search result relevance                  | Implement platform-specific filtering and sorting to improve result quality               |
