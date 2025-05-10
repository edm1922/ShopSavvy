# ShopSavvy: Your Shopping Companion App

ShopSavvy is a cross-platform shopping companion app that helps users find the best deals across multiple e-commerce platforms, with a focus on Philippine fashion and beauty platforms like Lazada, Zalora, and Shein. The app features an AI assistant, advanced search capabilities, price tracking, and personalized recommendations.

## Project Overview

ShopSavvy aims to simplify the shopping experience by:
- Comparing prices across multiple e-commerce platforms
- Providing AI-powered shopping assistance
- Tracking price history and alerting users to price drops
- Offering personalized product recommendations

For detailed development plans, see our [Unified Roadmap](docs/unified-roadmap.md).

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **AI Assistant**: Google Gemini API, Genkit
- **Data Source**: Serper.dev API with caching
- **DevOps**: GitHub Actions, Vercel deployment
- **Analytics**: Google Analytics, Supabase Analytics

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/shopsavvy.git
   cd shopsavvy
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Update the values as needed

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:9002](http://localhost:9002) in your browser.

## Serper.dev API Integration

ShopSavvy uses the Serper.dev API to gather product data from e-commerce platforms. This approach was chosen because:

1. It provides more reliable and consistent results than direct web scraping
2. It handles anti-bot detection and CAPTCHA challenges automatically
3. It allows us to search across multiple platforms with a single API call
4. It reduces maintenance overhead compared to custom web scrapers

### API Configuration

The Serper.dev API integration can be configured through environment variables:

- `SERPER_API_KEY`: Your Serper.dev API key
- `NEXT_PUBLIC_ENABLE_SEARCH_CACHE`: Set to `true` to enable caching of search results (recommended)
- `NEXT_PUBLIC_ENABLED_PLATFORMS`: Comma-separated list of platforms to search (e.g., `Lazada,Zalora,Shein`)

### Caching System

To optimize API usage and improve performance, ShopSavvy implements a caching system:

1. Search results are cached in Supabase for 7 days
2. Selective caching allows fetching fresh data only for platforms not in cache
3. Cache can be selectively refreshed for specific platforms

## Features

### Current Features

- Cross-platform product search across Lazada, Zalora, and Shein
- Advanced filtering by price, platform, and brand
- AI-powered shopping assistant with search suggestions
- User authentication with Supabase
- Responsive product display grid with detailed information
- Caching system for improved performance
- "COMING SOON" page for mobile app announcement
- Optimized for Vercel deployment

### Upcoming Features

- Price history tracking and visualization
- Price drop alerts via email and browser notifications
- Enhanced AI-powered personalized recommendations
- User wishlists and saved searches
- Mobile app with offline capabilities
- Social sharing features

## Project Structure

```
shopsavvy/
├── docs/                  # Documentation files
├── public/                # Static assets
├── scripts/               # Utility scripts
│   └── cleanup-for-deployment.js  # Deployment cleanup script
├── src/
│   ├── ai/                # AI assistant integration with Google Gemini
│   ├── app/               # Next.js app router
│   │   ├── (app)/         # App routes (dashboard, product pages)
│   │   ├── (auth)/        # Authentication routes (login, register)
│   │   ├── api/           # API routes
│   │   └── coming-soon/   # Coming soon page for mobile app
│   ├── components/        # React components
│   │   ├── app/           # Application-specific components
│   │   ├── landing/       # Landing page components
│   │   └── ui/            # UI components (Shadcn/UI)
│   ├── config/            # Configuration files
│   ├── contexts/          # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── services/          # Service layer
│       ├── ai/            # AI service integrations
│       ├── cache/         # Caching services
│       └── shopping-apis/ # Shopping API integrations
├── .env.local             # Environment variables
├── .vercelignore          # Files to exclude from Vercel deployment
├── next.config.js         # Next.js configuration
├── vercel.json            # Vercel deployment configuration
└── package.json           # Project dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Deployment

ShopSavvy is optimized for deployment on Vercel. To deploy:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy the project

The app includes:
- A `vercel.json` configuration file with optimized settings
- A `.vercelignore` file to exclude test files and debugging tools
- A cleanup script (`scripts/cleanup-for-deployment.js`) to identify files that should be excluded

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Supabase](https://supabase.io/)
- [Google Gemini](https://ai.google.dev/)
- [Serper.dev](https://serper.dev/)
- [Vercel](https://vercel.com/)
