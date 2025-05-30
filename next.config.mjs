/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "build",
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
  },
};

export default nextConfig;
