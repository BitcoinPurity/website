import { translator, localePath, type LocalizedProps } from "@/lib/i18n";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CopyableMono } from "@/components/CopyableMono";
import { ExternalLink } from "@/components/ExternalLink";
import { LaunchPanel } from "@/components/LaunchPanel";
import { PageHeader } from "@/components/PageHeader";
import { ScrollToId } from "@/components/ScrollToId";
import { StatusBadge } from "@/components/StatusBadge";
import { PARTNER_POOLS } from "@/content/links";
import { protocol } from "@/content/protocol";

export default function MinersPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);
  const smartPoolEndpoints = [
    {
      label: t("Main"),
      url: "stratum+tcp://smartpool-a.bitcoinpurity.org:3333",
    },
    {
      label: t("Backup"),
      url: "stratum+tcp://smartpool-b.bitcoinpurity.org:3333",
    },
    {
      label: t("Emergency"),
      url: "stratum+tcp://smartpool-a.bitcoinpurity.org:3433",
    },
  ] as const;

  return (
    <>
      <ScrollToId id="trial-solo-pool" />
      <PageHeader eyebrow={t("For miners")} title={t("Keep hashing Bitcoin.")}>
        {t(
          "SHA256d remains the proof-of-work algorithm. Existing SHA256 hardware is not intentionally invalidated by an algorithm switch.",
        )}
      </PageHeader>
      <Container className="space-y-14 py-16 sm:py-20">
        <LaunchPanel
          locale={locale}
          className="max-w-2xl"
          showTrialSoloPool={false}
        />
        <section className="max-w-2xl space-y-5 text-lg leading-relaxed text-muted">
          <p>
            <StatusBadge locale={locale} kind="unchanged" />
          </p>
          <p>
            {t(
              "ASERT is intended to allow difficulty to track changing available hash rate after activation. Purity retains Bitcoin’s 10-minute target interval (",
            )}
            {protocol.blockIntervalSeconds} {t("seconds).")}
          </p>
          <p>
            {t(
              "Mining involves substantial technical and economic risk. This page does not promise returns. Miners can use the hosted trial solo pool, SmartPool, or run DATUM on their own Purity node. Verify the endpoint and payout settings before committing hash rate.",
            )}
          </p>
          <p>
            {t(
              "The design avoids unnecessarily invalidating existing SHA256 mining investment as part of the fork. That is not a guarantee that every miner is protected from economic loss.",
            )}
          </p>
        </section>
        <dl className="grid gap-8 font-mono text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
              {t("PoW")}
            </dt>
            <dd className="mt-2 text-ink">{protocol.pow}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
              {t("DAA after activation")}
            </dt>
            <dd className="mt-2 text-ink">{protocol.asert.algorithm}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
              {t("Half-life")}
            </dt>
            <dd className="mt-2 text-ink">{t("24 hours")}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
              {t("Anchor")}
            </dt>
            <dd className="mt-2 text-ink">
              {t("enforcement-chain ")}
              {protocol.asert.anchorHeight}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
              {t("Activation height")}
            </dt>
            <dd className="mt-2 font-sans font-bold text-ink">
              {protocol.launch.activationHeight}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
              {t("Activation block hash")}
            </dt>
            <dd className="mt-2 break-all text-ink">
              {protocol.activationBlockHash}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
              {t("Mainnet launch")}
            </dt>
            <dd className="mt-2 text-ink">
              <time dateTime={protocol.launch.isoUtc}>
                {protocol.launch.timeLabel} · {protocol.launch.dateLabel}
              </time>
            </dd>
          </div>
        </dl>
        <section id="partner-pools" className="scroll-mt-24">
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            {t("Partner pools")}
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Independent solo pools that operators may point SHA256d hardware at. These are third-party services — verify each endpoint independently before committing hash rate.",
            )}
          </p>
          <div className="mt-8 grid gap-10 sm:grid-cols-2">
            {PARTNER_POOLS.map((pool) => (
              <div key={pool.name} className="space-y-4 font-mono text-sm">
                <h3 className="font-sans text-xl text-ink">{pool.name}</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                      {t("Website")}
                    </dt>
                    <dd className="mt-2">
                      <ExternalLink
                        locale={locale}
                        href={pool.website}
                        className="text-gold"
                      >
                        {pool.website
                          .replace(/^https?:\/\//, "")
                          .replace(/\/$/, "")}
                      </ExternalLink>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                      {t("Stratum")}
                    </dt>
                    <dd className="mt-2 space-y-2 text-ink">
                      {pool.stratum.map((url) => (
                        <div key={url}>
                          <CopyableMono locale={locale} value={url} />
                        </div>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-6" aria-labelledby="mining-options-title">
          <div>
            <h2
              id="mining-options-title"
              className="font-sans text-2xl font-bold tracking-tight text-ink"
            >
              {t("Mining options")}
            </h2>
            <p className="mt-2 max-w-3xl leading-relaxed text-muted">
              {t(
                "Choose a hosted pool or let your own Purity node build work for your miners.",
              )}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article
              id="trial-solo-pool"
              className="scroll-mt-28 space-y-5 border border-line p-5 sm:p-6"
            >
              <div>
                <p className="font-mono text-[11px] tracking-[0.16em] text-gold uppercase">
                  {t("Hosted solo mining")}
                </p>
                <h3 className="mt-2 text-xl font-bold text-ink">
                  {t("Trial solo pool")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t(
                    "Point SHA256d miners to the Purity trial pool. Choose the endpoint that fits your hardware.",
                  )}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted">
                    {t("High hash rate · port ")}
                    {protocol.launch.trialSoloPool.port}
                  </p>
                  <div className="mt-1">
                    <CopyableMono
                      locale={locale}
                      value={protocol.launch.trialSoloPool.url}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {`mindiff=${protocol.launch.trialSoloPool.mindiff} · startdiff=${protocol.launch.trialSoloPool.startdiff} · maxdiff=${protocol.launch.trialSoloPool.maxdiff}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted">
                    {t("Low hash rate · port")}{" "}
                    {protocol.launch.trialSoloPoolLowHash.port}
                  </p>
                  <div className="mt-1">
                    <CopyableMono
                      locale={locale}
                      value={protocol.launch.trialSoloPoolLowHash.url}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {`mindiff=${protocol.launch.trialSoloPoolLowHash.mindiff} · startdiff=${protocol.launch.trialSoloPoolLowHash.startdiff} · maxdiff=${protocol.launch.trialSoloPoolLowHash.maxdiff}`}
                  </p>
                </div>
              </div>
            </article>
            <article className="space-y-5 border border-line p-5 sm:p-6">
              <div>
                <p className="font-mono text-[11px] tracking-[0.16em] text-gold uppercase">
                  {t("Shared Stratum gateway")}
                </p>
                <h3 className="mt-2 text-xl font-bold text-ink">
                  {t("SmartPool")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t(
                    "Use the main listener first, then configure the backup and emergency listeners as miner failover endpoints.",
                  )}
                </p>
              </div>
              <dl className="space-y-3">
                {smartPoolEndpoints.map((endpoint) => (
                  <div key={endpoint.label}>
                    <dt className="text-sm text-muted">{endpoint.label}</dt>
                    <dd className="mt-1">
                      <CopyableMono locale={locale} value={endpoint.url} />
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
            <article className="space-y-5 border border-line p-5 sm:p-6">
              <div>
                <p className="font-mono text-[11px] tracking-[0.16em] text-gold uppercase">
                  {t("Self-hosted solo mining")}
                </p>
                <h3 className="mt-2 text-xl font-bold text-ink">
                  {t("Embedded DATUM gateway")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t(
                    "Purity can serve Stratum V1 miners from its embedded DATUM gateway. The node builds the work and pays valid block candidates to the Purity address configured on the node.",
                  )}
                </p>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted">
                <p>
                  {t(
                    "Enable DATUM in the node's options, set a payout address, and point miners on your network to:",
                  )}
                </p>
                <p className="break-all font-mono text-[13px] text-ink">
                  stratum+tcp://&lt;node-ip&gt;:23334
                </p>
                <p>
                  {t(
                    "Port 23334 is the default. The default listener is local-only (127.0.0.1). For LAN miners, bind to a trusted interface and enable Stratum authentication before allowing network access.",
                  )}
                </p>
              </div>
              <ExternalLink
                locale={locale}
                href="https://github.com/OCEAN-xyz/datum_gateway"
                className="inline-flex text-sm text-gold hover:text-ink"
              >
                {t("DATUM Gateway project →")}
              </ExternalLink>
            </article>
          </div>
        </section>
        <div className="flex flex-wrap gap-4">
          <ExternalLink
            locale={locale}
            href={protocol.docs.consensus}
            className="text-gold"
          >
            {t("Read the Consensus Specification")}
          </ExternalLink>
          <Link href={localePath("/run", locale)} className="text-gold">
            {t("Build / Run Bitcoin Purity")}
          </Link>
        </div>
      </Container>
    </>
  );
}
