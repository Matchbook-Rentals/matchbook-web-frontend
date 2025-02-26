/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
// Here's the rewritten code including Wikipedia Commons:
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'source.unsplash.com',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'placehold.co',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'utfs.io',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'upload.wikimedia.org',
    pathname: '/wikipedia/commons/**',
  },
  {
    protocol: 'https',
    hostname: 'img.clerk.com',
    pathname: '**',
  },

],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
