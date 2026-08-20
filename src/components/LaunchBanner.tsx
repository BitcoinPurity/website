import { CopyableMono } from "@/components/CopyableMono";
import { activationConf, protocol } from "@/content/protocol";

function HeightMark({ invert = false }: { invert?: boolean }) {
  return (
    <span
      className={`font-sans font-bold tracking-tight ${invert ? "text-[1.05rem] text-bg" : "text-ink"}`}
    >
      {protocol.launch.activationHeight}
    </span>
  );
}

export function LaunchBanner() {
  const { launch } = protocol;

  return (
    <div className="border-b border-[#b88810] bg-gold text-bg">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-5 py-3 sm:px-8 lg:flex-row lg:items-center lg:gap-8">
        <p className="shrink-0 font-mono text-[11px] font-semibold tracking-[0.22em] uppercase">
          Mainnet live
        </p>
        <div className="flex min-w-0 flex-1 flex-col gap-y-1.5 font-mono text-[13px] sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-6">
          <p>
            <span className="tracking-[0.12em] text-bg/70 uppercase">Launched</span>{" "}
            <time dateTime={launch.isoUtc} className="font-medium">
              {launch.timeLabel}
              <span className="text-bg/70"> · </span>
              {launch.dateLabel}
            </time>
          </p>
          <p className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-2">
            <span className="shrink-0 tracking-[0.12em] text-bg/70 uppercase">
              Source
            </span>
            <CopyableMono value={launch.releaseTag} invert>
              <span className="font-sans font-bold tracking-tight text-[1.05rem] text-bg">
                {launch.releaseTag}
              </span>
            </CopyableMono>
          </p>
          <p className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-2">
            <span className="shrink-0 tracking-[0.12em] text-bg/70 uppercase">
              Set
            </span>
            <CopyableMono value={activationConf} invert>
              {protocol.activationOption}=
              <HeightMark invert />
            </CopyableMono>
          </p>
          <div className="min-w-0 max-w-full sm:basis-full">
            <p className="tracking-[0.12em] text-bg/70 uppercase">Trial solo pool</p>
            <div className="mt-1 space-y-1">
              <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <span className="shrink-0 text-bg/85">For high hash rate miners</span>
                <CopyableMono value={launch.trialSoloPool} invert />
              </p>
              <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <span className="shrink-0 text-bg/85">For low hash rate miners</span>
                <CopyableMono value={launch.trialSoloPoolLowHash} invert />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
