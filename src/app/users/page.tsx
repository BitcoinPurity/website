import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { Container } from "@/components/Container";
import { CopyableMono } from "@/components/CopyableMono";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { SafetyCallout } from "@/components/SafetyCallout";
import { ScrollToId } from "@/components/ScrollToId";
import { ChainSplitDiagram } from "@/components/diagrams/ChainSplitDiagram";
import { PURITY_WALLET, SERVICES } from "@/content/links";
import { protocol } from "@/content/protocol";
import { pageMeta } from "@/lib/meta";

const { electrum } = SERVICES;

export const metadata = pageMeta(
  "For Users",
  "/users",
  "Bitcoin Purity keeps Bitcoin addresses, transaction format, and sighash. Compatibility is not the same as finality.",
);

export default function UsersPage() {
  return (
    <>
      <ScrollToId id="wallet" />
      <PageHeader eyebrow="For users" title="Your keys remain Bitcoin keys.">
        Address formats, transaction serialization, and sighash remain those of
        Bitcoin. Node binaries remain {protocol.binaries.join(", ")}. The default
        data directory remains {protocol.dataDirectory}.
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <section id="wallet" className="scroll-mt-24">
          <h2 className="text-3xl text-ink">Connect your wallet to Purity</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Bitcoin Purity uses the same addresses and transactions as Bitcoin.
            You do not need a separate Purity wallet — use BlueWallet, Sparrow, or
            any wallet that lets you point at a custom Electrum server. Your
            existing seed or keys work on Purity mainnet. Electrum desktop
            validates Bitcoin mainnet and cannot connect to Purity.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            A public Electrum server is available. Enter the settings below in
            your wallet&apos;s network or server preferences.
          </p>
          <dl className="mt-8 max-w-2xl border border-line font-mono text-sm">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                Server
              </dt>
              <dd className="mt-2">
                <CopyableMono value={electrum.host} />
              </dd>
            </div>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                Port
              </dt>
              <dd className="mt-2">
                <CopyableMono value={String(electrum.port)} />
              </dd>
            </div>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                SSL
              </dt>
              <dd className="mt-2 text-ink">Yes</dd>
            </div>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                Server string (BlueWallet)
              </dt>
              <dd className="mt-2">
                <CopyableMono value={electrum.bluewalletServer} />
              </dd>
            </div>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                Full URL (Sparrow Wallet 2.5.3 or earlier)
              </dt>
              <dd className="mt-2">
                <CopyableMono value={electrum.url} />
              </dd>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">
                Block explorer
              </dt>
              <dd className="mt-2">
                <CopyableMono value={SERVICES.mempoolExplorer} />
              </dd>
            </div>
          </dl>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                BlueWallet
              </h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
                <li>Open Settings → Network → Electrum Server.</li>
                <li>
                  Paste the server string above, or enter the host and SSL port
                  manually with SSL enabled.
                </li>
                <li>
                  Set Block Explorer to{" "}
                  <span className="font-mono text-ink">
                    {SERVICES.mempoolExplorer}
                  </span>
                  .
                </li>
                <li>Save and let the wallet sync.</li>
              </ol>
            </div>
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                Sparrow Wallet 2.5.3 or earlier
              </h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
                <li>Open Settings → Server.</li>
                <li>Choose Server Type: Public Electrum Server.</li>
                <li>
                  Paste{" "}
                  <span className="font-mono text-ink">{electrum.url}</span> as
                  the URL.
                </li>
                <li>
                  Set Block Explorer to{" "}
                  <span className="font-mono text-ink">
                    {SERVICES.mempoolExplorer}
                  </span>
                  .
                </li>
                <li>Set Fee Rate Source to Server.</li>
                <li>Apply and let the wallet sync.</li>
              </ol>
            </div>
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">
            This server helps your wallet read the Purity chain and broadcast
            transactions. It does not hold your keys. Before sending, read the{" "}
            <Link href="/safety" className="text-gold">
              Safety Guide
            </Link>{" "}
            — especially about replay and confirmation depth.
          </p>
        </section>
        <section>
          <h2 className="text-3xl text-ink">PurityWallet</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            PurityWallet is the official Android wallet published by Bitcoin
            Purity. The current release is 1.0.0. Download the APK and its
            SHA256SUMS file from the official release page, then verify the APK
            checksum before installing.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            <ExternalLink
              href={`${PURITY_WALLET}/releases/tag/1.0.0`}
              className="text-gold"
            >
              Download PurityWallet 1.0.0 →
            </ExternalLink>
            <ExternalLink
              href={`${PURITY_WALLET}/tree/1.0.0`}
              className="text-gold"
            >
              View source at tag 1.0.0 →
            </ExternalLink>
          </div>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
                Build from source · Android
              </h3>
              <p className="mt-4 leading-relaxed text-muted">
                Install Node.js 24, JDK 17, and Android SDK Platform 36 with
                Build Tools 36.0.0 and NDK 28.2.13676358. Then clone the
                published source tag and build a local debug APK:
              </p>
              <div className="mt-5">
                <CodeBlock
                  label="Clone and build"
                  code={`git clone --depth 1 --branch 1.0.0 ${PURITY_WALLET}.git\ncd PurityWallet\nnpm ci\ncd android\n./gradlew assembleDebug`}
                />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                The APK is written to{" "}
                <code className="font-mono text-ink">
                  android/app/build/outputs/apk/debug/app-debug.apk
                </code>
                . This locally built debug APK is for testing and is separate
                from the official release APK.
              </p>
            </div>
            <div className="border-l-2 border-gold bg-surface px-5 py-5 sm:px-6">
              <h3 className="text-xl font-bold text-ink">
                Use the official release
              </h3>
              <p className="mt-3 leading-relaxed text-muted">
                For normal installation, use the APK attached to the official
                release. Compare its SHA-256 value with the matching entry in
                the release&apos;s <code className="font-mono text-ink">SHA256SUMS</code> file.
                A locally built debug APK uses a different signing key and
                cannot update the official installation.
              </p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-3xl text-ink">Continuity</h2>
          <ul className="mt-6 max-w-2xl space-y-3 text-lg text-muted">
            <li>Bitcoin addresses are unchanged.</li>
            <li>Transaction format is unchanged.</li>
            <li>Sighash remains compatible.</li>
            <li>No transaction-level replay protection is added.</li>
            <li>You do not receive a new token.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-3xl text-ink">Compatibility is not the same as finality.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Because the formats remain compatible, a transaction may be valid on
            both Purity and a compatible legacy history. That is a design choice
            with trade-offs. Lack of replay protection is not risk-free.
          </p>
          <div className="mt-8">
            <ChainSplitDiagram />
          </div>
        </section>
        <SafetyCallout title="Treat settlement conservatively.">
          <p>
            Until hash rate and block production are stable and sufficient, do
            not treat unconfirmed or lightly confirmed payments from untrusted
            counterparties as final settlement.
          </p>
          <p>
            Understand replay behavior before spending during coexistence of
            Purity and legacy histories.
          </p>
          <p>
            <Link href="/safety" className="text-gold">
              Read the Safety Guide →
            </Link>
          </p>
        </SafetyCallout>
      </Container>
    </>
  );
}
