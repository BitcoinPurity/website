import { Container } from "@/components/Container";
import { DevelopmentStatus } from "@/components/DevelopmentStatus";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { CodeBlock } from "@/components/CodeBlock";
import { OsBuildTabs } from "@/components/OsBuildTabs";
import { protocol } from "@/content/protocol";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "Run a Node",
  "/run",
  "Build Bitcoin Purity from source. There is currently no official binary release.",
);

export default function RunPage() {
  return (
    <>
      <PageHeader eyebrow="Run a node" title="Build from source. Verify it yourself.">
        <p>
          There is currently no official binary release of Bitcoin Purity. Do
          not look for a download button here. Clone the repository and build
          it.
        </p>
        <DevelopmentStatus className="mt-8 max-w-xl" />
      </PageHeader>
      <Container className="space-y-14 py-16 sm:py-20">
        <section>
          <h2 className="text-3xl text-ink">What you get</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Binaries remain{" "}
            <span className="font-mono text-ink">{protocol.binaries.join(", ")}</span>.
            The default data directory remains{" "}
            <span className="font-mono text-ink">{protocol.dataDirectory}</span>.
            A full node stores the history of Bitcoin transactions and requires
            several hundred gigabytes or more of disk space. Initial
            synchronization can take hours to days.
          </p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Clone</h2>
          <div className="mt-5">
            <CodeBlock
              label="Git clone"
              code={`git clone ${protocol.github}.git
cd bitcoinpurity`}
            />
          </div>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Build</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            The repository uses CMake. Platform-specific dependency notes live in
            the repository and are linked below. This page does not invent
            package names beyond what those documents describe.
          </p>
          <div className="mt-8">
            <OsBuildTabs />
          </div>
        </section>

        <section>
          <h2 className="text-3xl text-ink">After building</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Built binaries are typically under{" "}
            <span className="font-mono text-ink">build/bin/</span>. Run{" "}
            <span className="font-mono text-ink">bitcoind</span> or{" "}
            <span className="font-mono text-ink">bitcoin-qt</span>. Use{" "}
            <span className="font-mono text-ink">bitcoin-cli</span> to talk to a
            running node.
          </p>
          <div className="mt-5">
            <CodeBlock
              label="Optional install"
              code="cmake --install build"
            />
          </div>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Activation height</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Operators set{" "}
            <span className="font-mono text-ink">-{protocol.activationOption}</span>
            . Until that value is locked into the datadir, the hard fork remains
            inactive. See the consensus document before setting it. This website
            does not announce a live mainnet launch.
          </p>
          <p className="mt-4">
            <ExternalLink href={protocol.docs.consensus} className="text-gold">
              Consensus specification
            </ExternalLink>
            {" · "}
            <ExternalLink href={protocol.docs.setup} className="text-gold">
              Setup and build docs
            </ExternalLink>
          </p>
        </section>
      </Container>
    </>
  );
}
