/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  // basePath is set via NEXT_PUBLIC_BASE_PATH env var for GitHub Pages
  // e.g. NEXT_PUBLIC_BASE_PATH=/island  (matches the repo name)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
