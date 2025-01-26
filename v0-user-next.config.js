/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'docs',
  images: {
    unoptimized: true,
    domains: [
      'raw.githubusercontent.com',
      'lh3.googleusercontent.com', // For Google profile pictures
    ],
  },
}

module.exports = nextConfig

