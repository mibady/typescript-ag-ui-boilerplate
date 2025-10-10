/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Temporarily disabled until all Phase 5 routes are built
    // typedRoutes: true,
  },
  images: {
    domains: ['images.unsplash.com', 'cdn.sanity.io'],
  },
};

export default nextConfig;
