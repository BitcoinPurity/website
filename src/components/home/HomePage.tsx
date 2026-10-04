import {
  translator,
  localePath,
  type Locale,
  type LocalizedProps,
} from "@/lib/i18n";
import Link from "next/link";
import { Container } from "@/components/Container";
import { LaunchPanel } from "@/components/LaunchPanel";
import { ExternalLink } from "@/components/ExternalLink";
import { FAQAccordion } from "@/components/FAQAccordion";
import { Logo } from "@/components/Logo";
import { SafetyCallout } from "@/components/SafetyCallout";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { SpecificationRow } from "@/components/SpecificationRow";
import { StatusBadge } from "@/components/StatusBadge";
import { BlockBoundaryDiagram } from "@/components/diagrams/BlockBoundaryDiagram";
import { ChainSplitDiagram } from "@/components/diagrams/ChainSplitDiagram";
import { PolicyToConsensus } from "@/components/diagrams/PolicyToConsensus";
import { ReorgDiagram } from "@/components/diagrams/ReorgDiagram";
import { homeFaqIds } from "@/content/faq";
import { CONTACT, SERVICES } from "@/content/links";
import { protocol } from "@/content/protocol";

function CtaLink({
  locale = "en",
  href,
  children,
  primary = false,
  external = false,
}: {
  locale?: Locale;
  href: string;
  children: string;
  primary?: boolean;
  external?: boolean;
}) {
  const className = primary
    ? "inline-flex min-h-12 items-center bg-gold px-5 text-sm font-medium text-bg hover:bg-[#e0b122]"
    : "inline-flex min-h-12 items-center border border-line px-5 text-sm text-ink hover:border-gold";

  if (external) {
    return (
      <ExternalLink locale={locale} href={href} className={className}>
        {children}
      </ExternalLink>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function HomePage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <>
      <section className="facet-field relative overflow-hidden">
        <Container wide className="py-16 lg:py-24">
          <Logo size={120} className="mb-8" />
          <p className="font-mono text-[12px] tracking-[0.28em] text-gold uppercase">
            Bitcoin Purity
          </p>
          <h1 className="mt-5 max-w-3xl">
            <Link
              href={localePath("/whitepaper", locale)}
              className="block text-[2.7rem] leading-[0.98] font-bold tracking-tight text-ink uppercase transition-colors hover:text-gold sm:text-6xl md:text-7xl"
            >
              {t("Whitepaper")}
              <br />
              {t("now available.")}
            </Link>
          </h1>
          <LaunchPanel locale={locale} className="mt-8 max-w-2xl" />
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
            {t(
              "Bitcoin Purity is a Bitcoin full node built to preserve Bitcoin as peer-to-peer electronic cash — not a general-purpose data-storage or application platform.",
            )}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <CtaLink locale={locale} href={localePath("/run", locale)} primary>
              {t("Run Bitcoin Purity")}
            </CtaLink>
            <CtaLink
              locale={locale}
              href={localePath("/miners#trial-solo-pool", locale)}
            >
              {t("For Miners")}
            </CtaLink>
            <CtaLink locale={locale} href={SERVICES.bbs} external>
              {t("BBS")}
            </CtaLink>
            <CtaLink locale={locale} href={localePath("/why-purity", locale)}>
              {t("Read the Vision")}
            </CtaLink>
          </div>
          <p className="mt-5">
            <ExternalLink
              locale={locale}
              href={protocol.github}
              className="text-sm text-muted hover:text-ink"
            >
              {t("View Source on GitHub")}
            </ExternalLink>
          </p>
          <div className="mt-16 max-w-xl">
            <BlockBoundaryDiagram locale={locale} />
          </div>
        </Container>
      </section>

      <div className="border-y border-line">
        <Container wide className="overflow-x-auto py-4">
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase whitespace-nowrap">
            {t(
              "SHA256d · Bitcoin addresses · Bitcoin transactions · Permanent Reduced Data rules",
            )}
          </p>
        </Container>
      </div>

      <section className="border-b border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Network")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("Live mainnet tools")}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="border border-line p-6 sm:p-8">
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("For miners")}
              </h3>
              <p className="mt-3 text-2xl text-ink">{t("Pool monitor")}</p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                {t(
                  "Monitor the trial solo pool — hash rate, workers, blocks, and payout status on Purity mainnet.",
                )}
              </p>
              <ExternalLink
                locale={locale}
                href={SERVICES.poolMonitor}
                className="mt-6 inline-flex text-gold hover:text-ink"
              >
                pool.bitcoinpurity.org →
              </ExternalLink>
            </div>
            <div className="border border-line p-6 sm:p-8">
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("For everyone")}
              </h3>
              <p className="mt-3 text-2xl text-ink">{t("Mempool explorer")}</p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                {t(
                  "Browse pending transactions, recent blocks, and fee estimates on the Purity network.",
                )}
              </p>
              <ExternalLink
                locale={locale}
                href={SERVICES.mempoolExplorer}
                className="mt-6 inline-flex text-gold hover:text-ink"
              >
                mempool.bitcoinpurity.org →
              </ExternalLink>
            </div>
            <div className="border border-line p-6 sm:p-8">
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("Community")}
              </h3>
              <p className="mt-3 text-2xl text-ink">{t("BBS")}</p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                {t(
                  "Username registration bulletin board — post and reply after signing up. Email optional, used only for password reset.",
                )}
              </p>
              <ExternalLink
                locale={locale}
                href={SERVICES.bbs}
                className="mt-6 inline-flex text-gold hover:text-ink"
              >
                bbs.bitcoinpurity.org →
              </ExternalLink>
            </div>
            <div className="border border-line p-6 sm:p-8">
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("For users")}
              </h3>
              <p className="mt-3 text-2xl text-ink">{t("Wallet connection")}</p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                {t(
                  "Connect BlueWallet, Sparrow, or any wallet that supports custom Electrum servers to view balances and send on Purity mainnet.",
                )}
              </p>
              <Link
                href={localePath("/users#wallet", locale)}
                className="mt-6 inline-flex text-gold hover:text-ink"
              >
                {t("Connection settings →")}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Purpose")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("What is Bitcoin for?")}
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="font-mono text-sm tracking-[0.2em] text-gold">
                {t("MONEY")}
              </h3>
              <ul className="mt-5 space-y-3 text-lg text-ink">
                <li>{t("Peer-to-peer electronic cash")}</li>
                <li>{t("Value transfer")}</li>
                <li>{t("Proof-of-work security")}</li>
                <li>{t("Self-verification")}</li>
                <li>{t("Scarce block space")}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-sm tracking-[0.2em] text-muted">
                {t("NOT A GENERAL-PURPOSE DATABASE")}
              </h3>
              <ul className="mt-5 space-y-3 text-lg text-muted">
                <li>{t("Arbitrary file storage")}</li>
                <li>{t("A general application layer")}</li>
                <li>{t("Consensus optimized around data embedding")}</li>
                <li>{t("Unbounded expansion of base-layer purpose")}</li>
              </ul>
            </div>
          </div>
          <p className="mt-16 max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("Block space is for money.")}
          </p>
        </Container>
      </section>

      <div className="rule" />

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Why the hard fork exists")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("Policy can change.")}
            <br />
            {t("Consensus endures.")}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Relay and mempool policy are configurable. Consensus is what fully validating nodes actually enforce. Bitcoin Purity exists because Bitcoin’s monetary purpose should not depend only on mempool policy. BIP110 / RDTS Reduced Data rules are made permanent through the Purity hard fork.",
            )}
          </p>
          <div className="mt-10 max-w-xl">
            <PolicyToConsensus locale={locale} />
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">
            {t(
              "The short-term consensus document in the repository is the source of truth.",
            )}{" "}
            <ExternalLink
              locale={locale}
              href={protocol.docs.consensus}
              className="text-gold"
            >
              {t("Read purity-consensus.md")}
            </ExternalLink>
          </p>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Continuity")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("Preserve Bitcoin's economic continuity.")}
          </h2>
          <div className="mt-14 grid gap-12 md:grid-cols-3">
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("Miners")}
              </h3>
              <p className="mt-3 text-2xl text-ink">{t("Keep SHA256d.")}</p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                {t(
                  "Bitcoin Purity keeps Bitcoin’s SHA256d proof-of-work rather than switching to an incompatible mining algorithm. The design avoids unnecessarily invalidating existing SHA256 mining investment as part of the fork. It does not promise mining profitability, and it does not imply every miner is guaranteed protection from economic loss.",
                )}
              </p>
            </div>
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("Users")}
              </h3>
              <p className="mt-3 text-2xl text-ink">
                {t("Keep Bitcoin transactions.")}
              </p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                {t(
                  "Bitcoin address formats remain unchanged. Transaction serialization remains unchanged. Sighash remains compatible. Bitcoin Purity deliberately introduces no transaction-level replay protection. Users do not receive a new token.",
                )}
              </p>
            </div>
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("Network")}
              </h3>
              <p className="mt-3 text-2xl text-ink">
                {t("Keep the path open.")}
              </p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                {t(
                  "Bitcoin Purity maintains transaction compatibility rather than forcing every user through a one-time token-claim or asset-conversion event. The intended long-term outcome is economic migration toward the Purity rules rather than the creation of a permanently separate “new coin.”",
                )}
              </p>
            </div>
          </div>
          <blockquote className="mt-16 max-w-3xl border-l-2 border-gold pl-6 text-2xl leading-snug text-ink sm:text-3xl">
            {t(
              "Don't destroy the capital that secures Bitcoin in order to save Bitcoin.",
            )}
          </blockquote>
          <p className="mt-4 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            {t("Project philosophy — not an empirical guarantee")}
          </p>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Proof-of-work")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("Keep hashing Bitcoin.")}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "SHA256d is unchanged. Hash-rate defense in this tree is operational: difficulty that tracks available work, and parking of deep reorgs — not an algorithm change. Mining involves substantial technical and economic risk.",
            )}
          </p>
          <div className="mt-8">
            <StatusBadge locale={locale} kind="unchanged" />
          </div>
          <p className="mt-8">
            <Link
              href={localePath("/miners#trial-solo-pool", locale)}
              className="text-gold"
            >
              {t("For miners →")}
            </Link>
          </p>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Replay compatibility")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("No forced migration day.")}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Bitcoin Purity intentionally adds no transaction-level replay protection. Because addresses, transaction formats, and sighash remain compatible, a transaction may be valid on both Purity and a compatible legacy history.",
            )}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Compatible transactions can potentially propagate to and be accepted by nodes on both histories, subject to each node’s current policy, chain state, and validity rules. Nodes maintain their own mempools.",
            )}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink">
            {t(
              "The protocol does not require users to convert Bitcoin into a newly created asset simply to remain compatible with Purity.",
            )}
          </p>
          <div className="mt-10">
            <ChainSplitDiagram locale={locale} />
          </div>
          <p className="mt-8">
            <Link href={localePath("/safety", locale)} className="text-gold">
              {t("Read the Safety Guide →")}
            </Link>
          </p>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SafetyCallout locale={locale}>
            <p>
              {t(
                "Bitcoin Purity intentionally preserves Bitcoin transaction compatibility and does not add transaction-level replay protection.",
              )}
            </p>
            <p>
              {t(
                "During periods of low or unstable Purity hash rate, reorganizations and double-spend attempts may present greater settlement risk.",
              )}
            </p>
            <p className="text-ink">
              {t(
                "Do not treat zero-confirmation or lightly confirmed payments from untrusted counterparties as final while network conditions are unstable.",
              )}
            </p>
            <p>
              {t(
                "For economically significant transactions, use more conservative confirmation requirements or delay settlement until hash rate and block production are sufficiently stable.",
              )}
            </p>
            <p>
              {t(
                "Understand replay behavior before spending during coexistence of Purity and legacy histories.",
              )}
            </p>
            <p>
              <Link href={localePath("/safety", locale)} className="text-gold">
                {t("Read the Safety Guide →")}
              </Link>
            </p>
          </SafetyCallout>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Difficulty")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("Difficulty follows available hash rate.")}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {t("After Purity activation, difficulty uses")}{" "}
            <span className="font-mono text-ink">
              {protocol.asert.algorithm}
            </span>{" "}
            {t("with a 24-hour half-life and a ")}
            {protocol.asert.targetIntervalSeconds}
            {t(
              "-second target interval. SHA256d proof-of-work is unchanged. The algorithm is intended to adapt more responsively when available hash rate differs substantially from the pre-fork network. It does not promise perfectly regular block times.",
            )}
          </p>
          <dl className="mt-10 grid gap-6 font-mono text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                {t("Algorithm")}
              </dt>
              <dd className="mt-2 text-ink">{protocol.asert.algorithm}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                {t("Half-life")}
              </dt>
              <dd className="mt-2 text-ink">
                {protocol.asert.halfLifeSeconds} {t("seconds")}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                {t("Anchor height")}
              </dt>
              <dd className="mt-2 text-ink">{protocol.asert.anchorHeight}</dd>
            </div>
          </dl>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Reorganization risk mitigation")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("Deep reorgs wait for an operator.")}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "If connecting a block would rewind the active chain by more than",
            )}{" "}
            {protocol.parking.depth}{" "}
            {t(
              "blocks, that block is parked rather than automatically reorganizing the active chain. This is local node policy, not a consensus guarantee. It is not 51% attack immunity.",
            )}
          </p>
          <div className="mt-6">
            <StatusBadge locale={locale} kind="local-policy" />
          </div>
          <div className="mt-10">
            <ReorgDiagram locale={locale} />
          </div>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("This tree")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("Protocol specification")}
          </h2>
          <p className="mt-6 max-w-2xl text-muted">
            {t("Summaries only.")}{" "}
            <ExternalLink
              locale={locale}
              href={protocol.docs.consensus}
              className="text-gold"
            >
              {t("The repository consensus specification is authoritative.")}
            </ExternalLink>
          </p>
          <div className="mt-10">
            <SpecificationRow
              locale={locale}
              index="01"
              title={t("Permanent RDTS")}
              status="consensus"
            >
              {t(
                "BIP110 / Reduced Data rules become permanently active under the Purity hard-fork rules at the hardcoded mainnet activation height (",
              )}
              {protocol.launch.activationHeight}
              {t("), and they do not expire.")}
            </SpecificationRow>
            <SpecificationRow
              locale={locale}
              index="02"
              title={t("Pinned activation block")}
              status="consensus"
            >
              {t("Mainnet accepts only activation block")}{" "}
              <span className="break-all font-mono text-ink">
                {protocol.activationBlockHash}
              </span>{" "}
              {t("at height ")}
              {protocol.launch.activationHeight}
              {t(
                ". This consensus pin remains enforced when checkpoints are disabled.",
              )}
            </SpecificationRow>
            <SpecificationRow
              locale={locale}
              index="03"
              title="SHA256d"
              status="unchanged"
            >
              {t("Proof-of-work remains SHA256d.")}
            </SpecificationRow>
            <SpecificationRow
              locale={locale}
              index="04"
              title={t("ASERT / 24H")}
              status="active-in-tree"
            >
              {t("Difficulty uses ")}
              {protocol.asert.algorithm} {t("after Purity activation.")}
            </SpecificationRow>
            <SpecificationRow
              locale={locale}
              index="05"
              title={t("Deep-reorg parking")}
              status="local-policy"
            >
              {t("Reorganizations deeper than ")}
              {protocol.parking.depth}{" "}
              {t(
                "blocks are parked for operator review by default. Local policy — not consensus.",
              )}
            </SpecificationRow>
            <SpecificationRow
              locale={locale}
              index="06"
              title={t("Bitcoin transaction compatibility")}
              status="unchanged"
            >
              {t(
                "Address formats, transaction serialization, and sighash remain Bitcoin-compatible.",
              )}
            </SpecificationRow>
            <SpecificationRow
              locale={locale}
              index="07"
              title={t("No transaction-level replay protection")}
              status="safety"
            >
              {t("This is intentional.")}{" "}
              <Link href={localePath("/safety", locale)} className="text-gold">
                {t("Read the Safety explanation.")}
              </Link>
            </SpecificationRow>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Direction")}</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            {t("Current tree, later research.")}
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4">
                <StatusBadge locale={locale} kind="active-in-tree" />
              </div>
              <h3 className="text-2xl text-ink">{t("Short-term")}</h3>
              <ul className="mt-4 space-y-2 text-muted">
                <li>{t("Permanent BIP110 / RDTS")}</li>
                <li>{t("24-hour ASERT, SHA256d unchanged")}</li>
                <li>{t("Deep-reorg parking")}</li>
                <li>{t("Double-spend freeze specified, not implemented")}</li>
              </ul>
            </div>
            <div>
              <div className="mb-4">
                <StatusBadge locale={locale} kind="roadmap" />
              </div>
              <h3 className="text-2xl text-ink">{t("Later / research")}</h3>
              <ul className="mt-4 space-y-2 text-muted">
                {protocol.laterRoadmap.map((item) => (
                  <li key={item}>{t(item)}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted">
            {t(
              "Roadmap items are research/product direction, not active consensus rules. They require separate specification and implementation decisions.",
            )}
          </p>
          <p className="mt-6">
            <Link href={localePath("/roadmap", locale)} className="text-gold">
              {t("Full roadmap →")}
            </Link>
          </p>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>{t("Questions")}</SectionEyebrow>
          <h2 className="text-4xl text-ink sm:text-5xl">{t("FAQ")}</h2>
          <div className="mt-10">
            <FAQAccordion locale={locale} ids={homeFaqIds} />
          </div>
          <p className="mt-8">
            <Link href={localePath("/faq", locale)} className="text-gold">
              {t("All questions →")}
            </Link>
          </p>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <div id="contact" className="scroll-mt-24">
            <SectionEyebrow>{t("Contact")}</SectionEyebrow>
            <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
              {t("Get in touch.")}
            </h2>
          </div>
          <dl className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("Email")}
              </dt>
              <dd className="mt-3">
                <a
                  href={CONTACT.emailHref}
                  className="text-lg text-ink hover:text-gold"
                >
                  {CONTACT.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                X
              </dt>
              <dd className="mt-3">
                <ExternalLink
                  locale={locale}
                  href={CONTACT.xHref}
                  className="text-lg text-ink hover:text-gold"
                >
                  {CONTACT.x}
                </ExternalLink>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                Telegram
              </dt>
              <dd className="mt-3">
                <ExternalLink
                  locale={locale}
                  href={CONTACT.telegramHref}
                  className="text-lg text-ink hover:text-gold"
                >
                  {CONTACT.telegram}
                </ExternalLink>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                Discord server
              </dt>
              <dd className="mt-3">
                <ExternalLink
                  locale={locale}
                  href={CONTACT.discordHref}
                  className="text-lg text-ink hover:text-gold"
                >
                  {CONTACT.discord}
                </ExternalLink>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("BBS")}
              </dt>
              <dd className="mt-3">
                <ExternalLink
                  locale={locale}
                  href={CONTACT.bbsHref}
                  className="text-lg text-ink hover:text-gold"
                >
                  {CONTACT.bbs}
                </ExternalLink>
              </dd>
            </div>
          </dl>
        </Container>
      </section>

      <section className="border-t border-line py-28 sm:py-36">
        <Container>
          <h2 className="max-w-3xl text-5xl leading-tight text-ink sm:text-6xl">
            {t("Bitcoin is enough.")}
          </h2>
          <p className="mt-6 max-w-xl text-lg text-muted">
            {t("Money does not need to become everything.")}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <CtaLink locale={locale} href={localePath("/run", locale)} primary>
              {t("Run Bitcoin Purity")}
            </CtaLink>
            <CtaLink locale={locale} href={protocol.github} external>
              {t("View Source on GitHub")}
            </CtaLink>
          </div>
          <p className="mt-20 font-mono text-sm leading-7 tracking-[0.2em] text-muted">
            {t("PEER-TO-PEER")}
            <br />
            {t("ELECTRONIC")}
            <br />
            {t("CASH")}
          </p>
        </Container>
      </section>
    </>
  );
}
