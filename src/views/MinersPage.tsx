import { translator, localePath, type LocalizedProps } from "@/lib/i18n";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { Container } from "@/components/Container";
import { CopyableMono } from "@/components/CopyableMono";
import { ExternalLink } from "@/components/ExternalLink";
import { LaunchPanel } from "@/components/LaunchPanel";
import { PageHeader } from "@/components/PageHeader";
import { ScrollToId } from "@/components/ScrollToId";
import { StatusBadge } from "@/components/StatusBadge";
import { MINING_MANUALS, PARTNER_POOLS } from "@/content/links";
import { protocol, sv2MiningGuideUrl } from "@/content/protocol";

const sv2ConfigExample = `server=1
datum=0
sv2=1
sv2listen=192.168.1.10
sv2port=23334
sv2pool=mining.example.com:3336
sv2jds=jds.example.com:3337
sv2poolkey=<MINING_AUTHORITY_PUBLIC_KEY>
sv2jdskey=<JDS_AUTHORITY_PUBLIC_KEY>
sv2identity=<POOL_ACCOUNT_IDENTITY>
sv2auth=1
sv2user=farm
sv2password=<LOCAL_MINER_PASSWORD>`;

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
        <section
          id="stratum-v2"
          aria-labelledby="stratum-v2-title"
          className="max-w-3xl scroll-mt-28 space-y-5 border border-gold p-5 leading-relaxed text-muted sm:p-8"
        >
          <div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-gold uppercase">
              {t("New in {0}", "v1.2.0")}
            </p>
            <h2 id="stratum-v2-title" className="mt-2 text-2xl font-bold text-ink">
              {t("Built-in Stratum V2 Gateway")}
            </h2>
          </div>
          <p className="border-l-2 border-gold pl-4 font-mono text-sm text-ink">
            {t("Stratum V1 miner → Purity Node → Stratum V2 pool")}
          </p>
          <p>{t("Connect existing Stratum V1 miners to a compatible Stratum V2 pool. Your Purity node selects transactions and declares its own block template.")}</p>
          <p>{t("The gateway only sends work after the pool confirms the custom job. No separate gateway or publicly exposed Template Provider port is needed.")}</p>
          <ol className="list-decimal space-y-5 pl-5 marker:font-bold marker:text-gold">
            <li className="space-y-2">
              <h3 className="font-bold text-ink">{t("Check your node and pool")}</h3>
              <p>{t("Use a synced Purity node built with {0}, the default build setting. The gateway is off until you set {1}. It supports mainnet and regtest only; Signet is unsupported. SV2 and DATUM Solo cannot run together.", "BUILD_SV2=ON", "sv2=1")}</p>
              <p>{t("Ask your pool for both Mining and Full-Template Job Declaration Server (JDS) endpoints, the authority public key for each, and the gateway’s upstream account identity. A Mining endpoint alone is not enough; the pool must support this Full-Template protocol dialect. Verify compatibility with your pool before switching miners.")}</p>
            </li>
            <li className="space-y-3">
              <h3 className="font-bold text-ink">{t("Configure and restart the node")}</h3>
              <p>{t("Replace the example LAN address, endpoints, public keys, account identity and local miner password with your own values in bitcoin.conf. The default listener is {0}; for LAN miners, bind to the node’s LAN address and allow TCP {1} from the miner network only.", "127.0.0.1:23334", 23334)}</p>
              <CodeBlock locale={locale} label="bitcoin.conf" code={sv2ConfigExample} />
            </li>
            <li className="space-y-3">
              <h3 className="font-bold text-ink">{t("Connect a miner and verify work")}</h3>
              <p>{t("With the example above, set the miner’s pool URL to the node’s LAN address below. Use {0} as the worker name and the value of {1} as the password. These local credentials are separate from {2}, the upstream account.", "farm.worker01", "sv2password", "sv2identity")}</p>
              <CopyableMono locale={locale} value="stratum+tcp://192.168.1.10:23334" />
              <CodeBlock locale={locale} label={t("Gateway status")} code="bitcoin-cli getsv2info" />
              <p>{t("On the same node, look for {0} and {1} before mining. After connecting a miner, check {2}. Only shares acknowledged by the pool count toward {3}.", 'status="running"', "running=true", "authorized_clients", "accepted_shares")}</p>
            </li>
          </ol>
          <ExternalLink locale={locale} href={sv2MiningGuideUrl} className="inline-flex text-gold hover:text-ink">
            {t("Read the official Stratum V2 setup guide (English)")} →
          </ExternalLink>
        </section>
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
              "Mining involves substantial technical and economic risk. This page does not promise returns. Verify the endpoint and payout settings before committing hash rate.",
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
            <p className="mt-3 text-sm">
              <ExternalLink
                locale={locale}
                href={
                  locale === "zh-CN"
                    ? MINING_MANUALS.zhCN
                    : locale === "zh-TW"
                      ? MINING_MANUALS.zhTW
                      : MINING_MANUALS.en
                }
                className="text-gold"
              >
                {t("Read the full mining manual")} →
              </ExternalLink>
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
          <section
            id="partner-pools"
            className="scroll-mt-24 border-t border-line pt-8"
          >
            <h3 className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              {t("Partner pools")}
            </h3>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">
              {t(
                "Independent mining pools for SHA256d hardware. These are third-party services — review each pool and its terms before committing hash rate.",
              )}
            </p>
            <div className="mt-8 grid gap-10 sm:grid-cols-2">
              {PARTNER_POOLS.map((pool) => (
                <div key={pool.name} className="space-y-3 font-mono text-sm">
                  <h4 className="font-sans text-xl text-ink">{pool.name}</h4>
                  <div>
                    <p className="text-[11px] tracking-[0.14em] text-muted uppercase">
                      {t("Website")}
                    </p>
                    <p className="mt-2">
                      <ExternalLink
                        locale={locale}
                        href={pool.website}
                        className="text-gold"
                      >
                        {pool.website
                          .replace(/^https?:\/\//, "")
                          .replace(/\/$/, "")}
                      </ExternalLink>
                    </p>
                  </div>
                  <p className="font-sans leading-relaxed text-muted">
                    {t(pool.description)}
                  </p>
                </div>
              ))}
            </div>
          </section>
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
