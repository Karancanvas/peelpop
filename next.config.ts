import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.GITHUB_ACTIONS ? "/peelpop" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/peelpop/" : "",
  images: { unoptimized: true },
};

export default nextConfig;
