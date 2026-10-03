import { translator, type LocalizedProps } from "@/lib/i18n";
import { Container } from "@/components/Container";
import { DevelopmentStatus } from "@/components/DevelopmentStatus";
import { ExternalLink } from "@/components/ExternalLink";
import { LaunchPanel } from "@/components/LaunchPanel";
import { PageHeader } from "@/components/PageHeader";
import { CodeBlock } from "@/components/CodeBlock";
import { OsBuildTabs } from "@/components/OsBuildTabs";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { binaryReleaseUrl, protocol } from "@/content/protocol";

export default function RunPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <>
      <PageHeader
        eyebrow={t("Run a node")}
        title={t("Download a binary, or build from source.")}
      >
        <p>
          {t(
            "Official binaries are published on GitHub Releases. Building from tagged source remains the path if you want to verify the software yourself.",
          )}
        </p>
        <LaunchPanel locale={locale} className="mt-8 max-w-2xl" />
        <DevelopmentStatus locale={locale} className="mt-8 max-w-xl" />
      </PageHeader>
      <Container className="space-y-20 py-16 sm:py-20">
        <section>
          <SectionEyebrow>{t("Option one")}</SectionEyebrow>
          <h2 className="text-3xl text-ink">{t("Download binaries")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Pre-built packages for common platforms are attached to release",
            )}{" "}
            <span className="font-mono text-ink">
              {protocol.launch.releaseTag}
            </span>
            {protocol.version.isReleaseCandidate
              ? t(" (release candidate)")
              : ""}
            {t(
              ". Prefer verifying checksums from the release page before you run anything.",
            )}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t("Binaries remain")}{" "}
            <span className="font-mono text-ink">
              {protocol.binaries.join(", ")}
            </span>
            {t(". The default data directory remains")}{" "}
            <span className="font-mono text-ink">{protocol.dataDirectory}</span>
            {t(
              ". A full node stores the history of Bitcoin transactions and requires several hundred gigabytes or more of disk space. Initial synchronization can take hours to days.",
            )}
          </p>
          <p className="mt-8">
            <ExternalLink
              locale={locale}
              href={binaryReleaseUrl}
              className="inline-flex min-h-12 items-center bg-gold px-5 text-sm font-medium text-bg hover:bg-[#e0b122]"
            >
              {t("Download ")}
              {protocol.launch.releaseTag}
            </ExternalLink>
          </p>
          <p className="mt-4">
            <ExternalLink
              locale={locale}
              href={binaryReleaseUrl}
              className="font-mono text-sm text-gold"
            >
              {binaryReleaseUrl.replace("https://", "")}
            </ExternalLink>
          </p>
        </section>

        <div className="border-t border-line" />

        <section className="space-y-14">
          <div>
            <SectionEyebrow>{t("Option two")}</SectionEyebrow>
            <h2 className="text-3xl text-ink">{t("Build from source")}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {t("Clone tagged source")}{" "}
              <span className="font-mono text-ink">
                {protocol.launch.releaseTag}
              </span>{" "}
              {t(
                "and build it. Platform-specific dependency notes live in the repository and are linked below.",
              )}
            </p>
          </div>

          <div>
            <h3 className="text-2xl text-ink">{t("Clone")}</h3>
            <div className="mt-5">
              <CodeBlock
                locale={locale}
                label={t("Git clone")}
                code={`git clone ${protocol.github}.git
cd bitcoinpurity
git checkout ${protocol.launch.releaseTag}`}
              />
            </div>
          </div>

          <div>
            <h3 className="text-2xl text-ink">{t("Build")}</h3>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {t(
                "The repository uses CMake. This page does not invent package names beyond what those documents describe.",
              )}
            </p>
            <div className="mt-8">
              <OsBuildTabs locale={locale} />
            </div>
          </div>

          <div>
            <h3 className="text-2xl text-ink">{t("After building")}</h3>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {t("Built binaries are typically under")}{" "}
              <span className="font-mono text-ink">{"build/bin/"}</span>
              {t(". Run")} <span className="font-mono text-ink">bitcoind</span>{" "}
              {t("or")} <span className="font-mono text-ink">bitcoin-qt</span>
              {t(". Use")}{" "}
              <span className="font-mono text-ink">bitcoin-cli</span>{" "}
              {t("to talk to a running node.")}
            </p>
            <div className="mt-5">
              <CodeBlock
                locale={locale}
                label={t("Optional install")}
                code="cmake --install build"
              />
            </div>
          </div>

          <div>
            <h3 className="text-2xl text-ink">
              {t("Activation and upgrades")}
            </h3>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {t("Mainnet Purity activation is hardcoded at block")}{" "}
              <span className="font-mono text-ink">
                {protocol.launch.activationHeight}
              </span>
              {t(". No activation parameter or datadir lock file is required.")}
            </p>
            <div className="mt-5 max-w-2xl">
              <CodeBlock
                locale={locale}
                label={t("Consensus-pinned activation block hash")}
                code={protocol.activationBlockHash}
              />
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              {t("Any other block at height")}{" "}
              <span className="font-mono text-ink">
                {protocol.launch.activationHeight}
              </span>{" "}
              {t("is invalid under consensus, independently of")}{" "}
              <span className="font-mono text-ink">-checkpoints=0</span>
              {t(
                ". If an existing block index contains a conflicting block from software used before this pin was enforced, restart with",
              )}{" "}
              <span className="font-mono text-ink">-reindex</span>{" "}
              {t("to rebuild it.")}
            </p>
            <p className="mt-4">
              <ExternalLink
                locale={locale}
                href={protocol.docs.consensus}
                className="text-gold"
              >
                {t("Consensus specification")}
              </ExternalLink>
              {" · "}
              <ExternalLink
                locale={locale}
                href={protocol.docs.setup}
                className="text-gold"
              >
                {t("Setup and build docs")}
              </ExternalLink>
            </p>
          </div>
        </section>
      </Container>
    </>
  );
}
