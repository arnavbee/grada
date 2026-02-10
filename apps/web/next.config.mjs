/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  reactStrictMode: true,
  distDir: isDev ? ".next-dev" : ".next",
};

export default nextConfig;
