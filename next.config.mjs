/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["jspdf"],
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.b-cdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "bunny.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
