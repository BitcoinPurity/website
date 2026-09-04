import { CopyableMono } from "@/components/CopyableMono";
import { ExternalLink } from "@/components/ExternalLink";
import {
  binaryReleaseUrl,
  mainnetLaunchedAt,
  protocol,
  releaseTagUrl,
} from "@/content/protocol";

export function LaunchPanel({ className = "" }: { className?: string }) {
  const { launch, version } = protocol;

  return (
    <aside
      className={`border border-gold bg-gold-dim ${className}`.trim()}
      aria-label="Mainnet status"
    >
      <div className="border-b border-line-gold px-5 py-4 sm:px-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-gold uppercase">
          Mainnet live
        </p>
        <p className="mt-2 text-lg leading-snug text-ink sm:text-xl">
          Bitcoin Purity mainnet launched at {mainnetLaunchedAt}.
        </p>
      </div>
      <dl>
        <div className="border-b border-line-gold px-5 py-5 sm:px-6">
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Release
          </dt>
          <dd className="mt-3">
            <div className="flex flex-wrap items-end gap-3">
              <p className="font-sans text-2xl font-bold leading-none tracking-tight text-ink sm:text-3xl">
                {launch.releaseTag}
              </p>
              {version.isReleaseCandidate ? (
                <span className="rounded border border-gold px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-gold uppercase">
                  Release candidate
                </span>
              ) : null}
              <CopyableMono value={launch.releaseTag}>
                <span className="sr-only">{launch.releaseTag}</span>
              </CopyableMono>
            </div>
          </dd>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Bitcoin Purity now uses its own{" "}
            <span className="font-mono text-ink">MAJOR.MINOR.PATCH</span>{" "}
            version series (for example{" "}
            <span className="font-mono text-ink">v1.0.0</span>,{" "}
            <span className="font-mono text-ink">v1.0.0rc2</span>). This is
            independent of the upstream Bitcoin Knots version. Current build:{" "}
            <span className="font-mono text-ink">{version.release}</span>, based
            on Bitcoin Knots{" "}
            <span className="font-mono text-ink">{protocol.knotsBase}</span>{" "}
            (Bitcoin Core consensus baseline{" "}
            <span className="font-mono text-ink">
              {protocol.coreConsensusBaseline}
            </span>
            ).
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Official release for mainnet. Download binaries from{" "}
            <ExternalLink href={binaryReleaseUrl} className="font-mono text-gold">
              {launch.releaseTag}
            </ExternalLink>
            , or clone{" "}
            <ExternalLink href={releaseTagUrl} className="font-mono text-gold">
              {launch.releaseTag}
            </ExternalLink>{" "}
            and build it yourself. See{" "}
            <ExternalLink href={protocol.docs.versioning} className="text-gold">
              doc/VERSION.md
            </ExternalLink>{" "}
            for the full versioning convention.
          </p>
        </div>
        <div className="border-b border-line-gold px-5 py-5 sm:px-6">
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Activation block
          </dt>
          <dd className="mt-3">
            <p className="font-mono text-sm text-muted">Height</p>
            <p className="mt-1 font-sans text-4xl font-bold leading-none tracking-tight text-ink sm:text-5xl">
              {launch.activationHeight}
            </p>
            <div className="mt-4">
              <CopyableMono value={protocol.activationBlockHash} />
            </div>
          </dd>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Mainnet activation is hardcoded at height{" "}
            <span className="font-sans font-bold text-ink">
              {launch.activationHeight}
            </span>. The block hash above is consensus-pinned; a different block
            at this height is invalid. If an existing block index contains a
            conflicting block after upgrading, restart with{" "}
            <span className="font-mono text-ink">-reindex</span>.
          </p>
        </div>
        <div
          id="trial-solo-pool"
          className="scroll-mt-28 px-5 py-5 sm:px-6"
        >
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Trial solo pool
          </dt>
          <dd className="mt-3 space-y-5 text-ink">
            <div>
              <p className="text-sm text-muted">
                For high hash rate miners · port {launch.trialSoloPool.port}
              </p>
              <div className="mt-2">
                <CopyableMono value={launch.trialSoloPool.url} />
              </div>
              <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">
                {`mindiff=${launch.trialSoloPool.mindiff} · startdiff=${launch.trialSoloPool.startdiff} · maxdiff=${launch.trialSoloPool.maxdiff}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">
                For low hash rate miners · port{" "}
                {launch.trialSoloPoolLowHash.port}
              </p>
              <div className="mt-2">
                <CopyableMono value={launch.trialSoloPoolLowHash.url} />
              </div>
              <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">
                {`mindiff=${launch.trialSoloPoolLowHash.mindiff} · startdiff=${launch.trialSoloPoolLowHash.startdiff} · maxdiff=${launch.trialSoloPoolLowHash.maxdiff}`}
              </p>
            </div>
          </dd>
        </div>
      </dl>
    </aside>
  );
}
