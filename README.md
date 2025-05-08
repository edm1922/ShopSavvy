# ShopSavvy: Your Shopping Companion App

ShopSavvy is a cross-platform shopping companion app that helps users find the best deals across multiple e-commerce platforms, with a focus on local platforms like Shopee and Lazada. The app features an AI assistant, advanced search capabilities, price tracking, and personalized recommendations.

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
- **Data Source**: Web scraping (Axios, Cheerio)
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

## Web Scraping Approach

ShopSavvy uses web scraping to gather product data from e-commerce platforms. This approach was chosen because:

1. Official API access is often limited or requires lengthy approval processes
2. Web scraping allows us to support a wider range of platforms
3. We have more control over the data we can extract

### Scraping Configuration

The web scraping functionality can be configured through environment variables:

- `NEXT_PUBLIC_USE_REAL_SCRAPING`: Set to `true` to enable real scraping, `false` to use mock data
- `NEXT_PUBLIC_ENABLED_PLATFORMS`: Comma-separated list of platforms to scrape (e.g., `Shopee,Lazada`)
- `NEXT_PUBLIC_SCRAPING_REQUEST_DELAY`: Delay between requests in milliseconds
- `NEXT_PUBLIC_SCRAPING_MAX_RETRIES`: Maximum number of retries for failed requests
- `NEXT_PUBLIC_SCRAPING_CACHE_TTL`: Cache time-to-live in seconds

### Legal Considerations

When using the web scraping functionality, please be aware of the following:

1. Respect the terms of service of the websites you scrape
2. Implement rate limiting to avoid overloading servers
3. Consider using a proxy rotation system for production use
4. Only store necessary data and attribute sources appropriately

## Features

### Current Features

- Basic product search with mock data
- Simple product display grid
- AI assistant for search suggestions

### Upcoming Features

- Cross-platform price comparison
- Price history tracking
- Price drop alerts
- Personalized recommendations
- User accounts and wishlists
- Mobile optimization

## Project Structure

```
shopsavvy/
├── docs/                  # Documentation files
├── public/                # Static assets
├── src/
│   ├── ai/                # AI assistant integration
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   │   ├── app/           # Application-specific components
│   │   └── ui/            # UI components (Shadcn/UI)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── services/          # Service layer
│       └── scrapers/      # Web scraping implementation
├── .env.local             # Environment variables
├── next.config.ts         # Next.js configuration
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

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Supabase](https://supabase.io/)
- [Google Gemini](https://ai.google.dev/)
