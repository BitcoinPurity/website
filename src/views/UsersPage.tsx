import { translator, localePath, type LocalizedProps } from "@/lib/i18n";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CopyableMono } from "@/components/CopyableMono";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { SafetyCallout } from "@/components/SafetyCallout";
import { ScrollToId } from "@/components/ScrollToId";
import { ChainSplitDiagram } from "@/components/diagrams/ChainSplitDiagram";
import { PURITY_WALLET, PURITY_WALLET_PC, SERVICES } from "@/content/links";
import { protocol } from "@/content/protocol";

const { electrum } = SERVICES;

export default function UsersPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <>
      <ScrollToId id="wallet" />
      <PageHeader
        eyebrow={t("For users")}
        title={t("Your keys remain Bitcoin keys.")}
      >
        {t(
          "Address formats, transaction serialization, and sighash remain those of Bitcoin. Node binaries remain ",
        )}
        {protocol.binaries.join(", ")}
        {t(". The default data directory remains ")}
        {protocol.dataDirectory}
        {t(".")}
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <section id="wallet" className="scroll-mt-24">
          <h2 className="text-3xl text-ink">{t("Recommended wallets")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Use PurityWallet on Android or desktop to view balances and send on Purity mainnet.",
            )}
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="border border-gold bg-surface p-6 sm:p-8">
              <h3 className="text-2xl text-ink">{t("PurityWallet · Android")}</h3>
              <p className="mt-4 leading-relaxed text-muted">
                {t(
                  "The recommended Android wallet for Bitcoin Purity. Download the APK from the release page and verify its checksum before installing.",
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                <ExternalLink
                  locale={locale}
                  href={`${PURITY_WALLET}/releases`}
                  className="text-gold"
                >
                  {t("Download Android wallet →")}
                </ExternalLink>
                <ExternalLink
                  locale={locale}
                  href={PURITY_WALLET}
                  className="text-gold"
                >
                  {t("View source →")}
                </ExternalLink>
              </div>
            </div>
            <div className="border border-gold bg-surface p-6 sm:p-8">
              <h3 className="text-2xl text-ink">{t("PurityWallet · Desktop")}</h3>
              <p className="mt-4 leading-relaxed text-muted">
                {t(
                  "The recommended multi-platform desktop wallet for Bitcoin Purity. Choose the package for your operating system from the release page.",
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                <ExternalLink
                  locale={locale}
                  href={`${PURITY_WALLET_PC}/releases`}
                  className="text-gold"
                >
                  {t("Download desktop wallet →")}
                </ExternalLink>
                <ExternalLink
                  locale={locale}
                  href={PURITY_WALLET_PC}
                  className="text-gold"
                >
                  {t("View source →")}
                </ExternalLink>
              </div>
            </div>
          </div>
        </section>
        <section id="alternative-wallets" className="scroll-mt-24">
          <h2 className="text-3xl text-ink">
            {t("Alternative wallets")}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "BlueWallet is a mobile alternative, and Sparrow Wallet 2.5.3 or earlier is a desktop alternative. Both require a custom Electrum server. Electrum desktop validates Bitcoin mainnet and cannot connect to Purity.",
            )}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "A public Electrum server is available. Enter the settings below in your wallet's network or server preferences.",
            )}
          </p>
          <dl className="mt-8 max-w-2xl border border-line font-mono text-sm">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                {t("Server")}
              </dt>
              <dd className="mt-2">
                <CopyableMono locale={locale} value={electrum.host} />
              </dd>
            </div>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                {t("Port")}
              </dt>
              <dd className="mt-2">
                <CopyableMono locale={locale} value={String(electrum.port)} />
              </dd>
            </div>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                SSL
              </dt>
              <dd className="mt-2 text-ink">{t("Yes")}</dd>
            </div>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                {t("Server string (BlueWallet)")}
              </dt>
              <dd className="mt-2">
                <CopyableMono
                  locale={locale}
                  value={electrum.bluewalletServer}
                />
              </dd>
            </div>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                {t("Full URL (Sparrow Wallet 2.5.3 or earlier)")}
              </dt>
              <dd className="mt-2">
                <CopyableMono locale={locale} value={electrum.url} />
              </dd>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                {t("Block explorer")}
              </dt>
              <dd className="mt-2">
                <CopyableMono
                  locale={locale}
                  value={SERVICES.mempoolExplorer}
                />
              </dd>
            </div>
          </dl>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("Mobile alternative")} · BlueWallet
              </h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
                <li>{t("Open Settings → Network → Electrum Server.")}</li>
                <li>
                  {t(
                    "Paste the server string above, or enter the host and SSL port manually with SSL enabled.",
                  )}
                </li>
                <li>
                  {t("Set Block Explorer to")}{" "}
                  <span className="font-mono text-ink">
                    {SERVICES.mempoolExplorer}
                  </span>
                  {t(".")}
                </li>
                <li>{t("Save and let the wallet sync.")}</li>
              </ol>
            </div>
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                {t("Desktop alternative")} · {t("Sparrow Wallet 2.5.3 or earlier")}
              </h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
                <li>{t("Open Settings → Server.")}</li>
                <li>{t("Choose Server Type: Private Electrum.")}</li>
                <li>
                  {t("Paste")}{" "}
                  <span className="font-mono text-ink">{electrum.url}</span>{" "}
                  {t("as the URL.")}
                </li>
                <li>
                  {t("Set Block Explorer to")}{" "}
                  <span className="font-mono text-ink">
                    {SERVICES.mempoolExplorer}
                  </span>
                  {t(".")}
                </li>
                <li>{t("Set Fee Rate Source to Server.")}</li>
                <li>{t("Apply and let the wallet sync.")}</li>
              </ol>
            </div>
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">
            {t(
              "This server helps your wallet read the Purity chain and broadcast transactions. It does not hold your keys. Before sending, read the",
            )}{" "}
            <Link href={localePath("/safety", locale)} className="text-gold">
              {t("Safety Guide")}
            </Link>{" "}
            {t("— especially about replay and confirmation depth.")}
          </p>
        </section>
        <section>
          <h2 className="text-3xl text-ink">{t("Continuity")}</h2>
          <ul className="mt-6 max-w-2xl space-y-3 text-lg text-muted">
            <li>{t("Bitcoin addresses are unchanged.")}</li>
            <li>{t("Transaction format is unchanged.")}</li>
            <li>{t("Sighash remains compatible.")}</li>
            <li>{t("No transaction-level replay protection is added.")}</li>
            <li>{t("You do not receive a new token.")}</li>
          </ul>
        </section>
        <section>
          <h2 className="text-3xl text-ink">
            {t("Compatibility is not the same as finality.")}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Because the formats remain compatible, a transaction may be valid on both Purity and a compatible legacy history. That is a design choice with trade-offs. Lack of replay protection is not risk-free.",
            )}
          </p>
          <div className="mt-8">
            <ChainSplitDiagram locale={locale} />
          </div>
        </section>
        <SafetyCallout
          locale={locale}
          title={t("Treat settlement conservatively.")}
        >
          <p>
            {t(
              "Until hash rate and block production are stable and sufficient, do not treat unconfirmed or lightly confirmed payments from untrusted counterparties as final settlement.",
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
    </>
  );
}
