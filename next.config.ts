import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // La base SQLite y los adjuntos se escriben en cada request: si se vigilan, el dev server recompila en bucle.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**", "**/prisma/**", "**/uploads/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
