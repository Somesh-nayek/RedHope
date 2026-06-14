import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@red-hope/ui', '@red-hope/types', '@red-hope/auth']
};

export default nextConfig;
