/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure webpack to handle Playwright font files
  webpack: (config, { isServer, dev }) => {
    // Add a rule for font files
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      issuer: { and: [/\.(js|ts|md)x?$/] },
      type: 'asset/resource',
    });

    // Handle Playwright assets specifically
    config.module.rules.push({
      test: /playwright-core\/lib\/vite\/recorder\/assets\/.+\.(ttf|png)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'static/chunks/',
          },
        },
      ],
    });

    // Handle Node.js built-in modules and Playwright
    if (isServer) {
      // For server-side, we don't need to bundle these modules
      config.externals = [
        ...(config.externals || []),
        'playwright-core',
        'playwright',
      ];
    } else {
      // For client-side, provide empty implementations for Node.js built-in modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        readline: false,
        constants: false,
        assert: false,
        buffer: require.resolve('buffer/'),
        events: require.resolve('events/'),
        util: require.resolve('util/'),
        querystring: require.resolve('querystring-es3'),
        url: require.resolve('url/'),
        string_decoder: require.resolve('string_decoder/'),
        punycode: require.resolve('punycode/'),
      };
    }

    // Completely ignore Playwright in client-side builds
    if (!isServer) {
      config.module.rules.push({
        test: /playwright-core|playwright/,
        use: 'null-loader',
      });
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable server components
    serverComponents: true,

    // Enable app directory
    appDir: true,
  },

  // Configure images
  images: {
    domains: [
      'olazrafayxrpqyajufle.supabase.co',
      'cf.shopee.ph',
      'lzd-img-global.slatic.net',
      'down-ph.img.susercontent.com',
      'play-lh.googleusercontent.com',
      'img.lazcdn.com',
      'sg-test-11.slatic.net',
      'ph-test-11.slatic.net',
      'my-test-11.slatic.net',
      'th-test-11.slatic.net',
      'vn-test-11.slatic.net',
      'id-test-11.slatic.net',
      // Google domains for Google Shopping images
      'encrypted-tbn0.gstatic.com',
      'encrypted-tbn1.gstatic.com',
      'encrypted-tbn2.gstatic.com',
      'encrypted-tbn3.gstatic.com',
      'encrypted-tbn4.gstatic.com',
      'encrypted-tbn5.gstatic.com',
      'encrypted-tbn6.gstatic.com',
      'encrypted-tbn7.gstatic.com',
      'encrypted-tbn8.gstatic.com',
      'encrypted-tbn9.gstatic.com',
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ENABLE_AI_ASSISTANT: process.env.NEXT_PUBLIC_ENABLE_AI_ASSISTANT,
  },
};

module.exports = nextConfig;
