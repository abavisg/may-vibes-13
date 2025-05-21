
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**', // Made more general to cover all paths
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Added due to redirects
        port: '',
        pathname: '/**', // General pathname for actual image files
      },
    ],
  },
};

export default nextConfig;
