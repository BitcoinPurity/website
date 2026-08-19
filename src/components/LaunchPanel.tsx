import { CopyableMono } from "@/components/CopyableMono";
import { activationConf, protocol } from "@/content/protocol";

export function LaunchPanel({ className = "" }: { className?: string }) {
  const { launch } = protocol;

  return (
    <aside
      className={`border border-gold bg-gold-dim ${className}`.trim()}
      aria-label="Launch schedule"
    >
      <div className="border-b border-line-gold px-5 py-4 sm:px-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-gold uppercase">
          Launch today
        </p>
        <p className="mt-2 text-lg leading-snug text-ink sm:text-xl">
          Bitcoin Purity activates at {launch.timeLabel} on {launch.dateLabel}.
        </p>
      </div>
      <dl>
        <div className="border-b border-line-gold px-5 py-5 sm:px-6">
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Start
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
            Set{" "}
            <span className="font-mono text-ink">
              -{protocol.activationOption}=
              <span className="font-sans font-bold">{launch.activationHeight}</span>
            </span>{" "}
            on first start, or the matching bitcoin.conf key. The value is written
            to{" "}
            <span className="font-mono text-ink">{protocol.activationFile}</span>{" "}
            and then becomes permanent for that datadir.
          </p>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Trial solo pool
          </dt>
          <dd className="mt-3 text-ink">
            <CopyableMono value={launch.trialSoloPool} />
          </dd>
        </div>
      </dl>
    </aside>
  );
}
