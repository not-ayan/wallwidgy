/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'raw.githubusercontent.com',
      'lh3.googleusercontent.com', // For Google profile pictures
    ],
  },
}

module.exports = nextConfig

