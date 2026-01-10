/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable source maps in development for React Inspector
  productionBrowserSourceMaps: false,
  
  async rewrites() {
    return {
      // These rewrites are checked before pages/public files
      beforeFiles: [
        // Internal Next.js API routes - DON'T proxy these
        {
          source: '/api/__open-stack-frame-in-editor',
          destination: '/api/__open-stack-frame-in-editor',
        },
      ],
      // These rewrites are checked after pages/public files but before dynamic routes
      afterFiles: [],
      // These rewrites are checked after all pages and dynamic routes
      fallback: [
        // Proxy all other /api/* requests to FastAPI backend
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ],
    };
  },
  
  // Webpack config for better source maps
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'source-map';
    }
    return config;
  },
};

module.exports = nextConfig;
