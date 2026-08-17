const nextConfig = {
  reactStrictMode: true,
  // All landing/dashboard media is served locally or via the /static proxy;
  // keep the next/image remote allowlist empty so the optimizer can't be
  // used as an open proxy for arbitrary origins.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
