import { CopyableMono } from "@/components/CopyableMono";
import { ExternalLink } from "@/components/ExternalLink";
import { activationConf, mainnetLaunchedAt, protocol, releaseTagUrl } from "@/content/protocol";

export function LaunchPanel({ className = "" }: { className?: string }) {
  const { launch } = protocol;

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
            Mainnet launch
          </dt>
          <dd className="mt-2">
            <time
              dateTime={launch.isoUtc}
              className="font-mono text-2xl leading-none text-ink sm:text-3xl"
            >
              {launch.timeLabel}
            </time>
            <p className="mt-2 font-mono text-sm text-muted">{launch.dateLabel}</p>
          </dd>
        </div>
        <div className="border-b border-line-gold px-5 py-5 sm:px-6">
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Source release
          </dt>
          <dd className="mt-3">
            <div className="flex flex-wrap items-end gap-3">
              <p className="font-sans text-2xl font-bold leading-none tracking-tight text-ink sm:text-3xl">
                {launch.releaseTag}
              </p>
              <CopyableMono value={launch.releaseTag}>
                <span className="sr-only">{launch.releaseTag}</span>
              </CopyableMono>
            </div>
          </dd>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Official tagged source for mainnet. There is no official binary
            release — clone{" "}
            <ExternalLink href={releaseTagUrl} className="font-mono text-gold">
              {launch.releaseTag}
            </ExternalLink>{" "}
            and build it.
          </p>
        </div>
        <div className="border-b border-line-gold px-5 py-5 sm:px-6">
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Node parameter
          </dt>
          <dd className="mt-3">
            <p className="font-mono text-sm text-muted">
              {protocol.activationOption}=
            </p>
            <div className="mt-1 flex flex-wrap items-end gap-3">
              <p className="font-sans text-4xl font-bold leading-none tracking-tight text-ink sm:text-5xl">
                {launch.activationHeight}
              </p>
              <CopyableMono value={activationConf}>
                <span className="sr-only">{activationConf}</span>
              </CopyableMono>
            </div>
          </dd>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Mainnet activated at height{" "}
            <span className="font-sans font-bold text-ink">
              {launch.activationHeight}
            </span>
            . New nodes should use{" "}
            <span className="font-mono text-ink">
              -{protocol.activationOption}=
              <span className="font-sans font-bold">{launch.activationHeight}</span>
            </span>{" "}
            or the matching bitcoin.conf key. The value is written to{" "}
            <span className="font-mono text-ink">{protocol.activationFile}</span>{" "}
            and then becomes permanent for that datadir.
          </p>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Trial solo pool
          </dt>
          <dd className="mt-3 space-y-4 text-ink">
            <div>
              <p className="text-sm text-muted">For high hash rate miners</p>
              <div className="mt-2">
                <CopyableMono value={launch.trialSoloPool} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted">For low hash rate miners</p>
              <div className="mt-2">
                <CopyableMono value={launch.trialSoloPoolLowHash} />
              </div>
            </div>
          </dd>
        </div>
      </dl>
    </aside>
  );
}
