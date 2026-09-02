import type { NextConfig } from "next";
import { getBuildId } from "./scripts/build-id.mjs";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Bust fingerprinted asset URLs on each CI/deploy so browsers cannot keep
  // an old JS/CSS shell that still renders removed chrome (e.g. LaunchBanner).
  generateBuildId: async () => getBuildId(),
};

export default nextConfig;
