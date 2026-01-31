import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  // Transpile specific packages that need it
  transpilePackages: ['slate', 'slate-react', 'slate-dom', 'slate-history'],
  // Configure for standalone output (useful for deployment)
  output: 'standalone',
  // Disable TypeScript errors during builds for now
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
