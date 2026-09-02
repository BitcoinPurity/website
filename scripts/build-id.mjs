/** Shared deploy build id — must match next.config.ts generateBuildId. */
export function getBuildId() {
  return (
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.WORKERS_CI_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    `local-${Date.now()}`
  );
}

export function getBuildIdShort(buildId = getBuildId()) {
  return buildId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "dev";
}
