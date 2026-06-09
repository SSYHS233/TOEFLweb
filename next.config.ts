import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/TOEFLweb",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
