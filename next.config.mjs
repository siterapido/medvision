import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  org: "insightfy-dr",
  project: "medvision",
  /** Região US (mesmo host usado no dashboard insightfy-dr.sentry.io) */
  sentryUrl: "https://us.sentry.io",
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
  },
  sourcemaps: {
    /** Evita publicar .map no artefato após o upload; SENTRY_AUTH_TOKEN necessário */
    deleteSourcemapsAfterUpload: true,
  },
});
