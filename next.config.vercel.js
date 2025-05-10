/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Configure image domains for Next.js Image component
  images: {
    domains: [
      'olazrafayxrpqyajufle.supabase.co',
      'lzd-img-global.slatic.net',
      'ph-live.slatic.net',
      'ph-test-11.slatic.net',
      'dynamic-media-cdn.tripadvisor.com',
      'img.ltwebstatic.com',
      'cdn.shopify.com',
      'images.unsplash.com',
      'static-ph.zacdn.com',
      'zalora-media-live-ph.s3.amazonaws.com',
      'dynamic.zacdn.com',
      'static-ph.zacdn.com',
      'a.storyblok.com',
      'images.pexels.com',
      'images.shein.com',
      'img.shein.com',
      'img.ltwebstatic.com',
      'cdn.shopify.com',
      'cdn.shopee.ph',
      'down-ph.img.susercontent.com',
      'cf.shopee.ph',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'www.datocms-assets.com',
      'www.gravatar.com',
      'images.clerk.dev',
      'uploadthing.com',
      'utfs.io',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Configure redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/app/dashboard',
        permanent: true,
      },
    ];
  },

  // Configure webpack to handle specific file types
  webpack(config) {
    // Add support for importing SVG files as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Disable type checking during build for Vercel deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable ESLint during build for Vercel deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
