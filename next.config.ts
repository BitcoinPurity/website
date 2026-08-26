import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Bust fingerprinted asset URLs on each CI/deploy so browsers cannot keep
  // an old JS/CSS shell that still renders removed chrome (e.g. LaunchBanner).
  generateBuildId: async () =>
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.WORKERS_CI_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    `local-${Date.now()}`,
};

export default nextConfig;
