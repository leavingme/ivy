/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  // Silence Turbopack warning when webpack config exists
  turbopack: {},
}

export default nextConfig
