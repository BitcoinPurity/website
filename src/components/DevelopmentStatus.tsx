import { protocol, mainnetLaunchedAt } from "@/content/protocol";

export function DevelopmentStatus({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`border-l-2 border-gold bg-surface px-5 py-4 ${className}`.trim()}
      aria-label="Mainnet status"
    >
      <p className="font-mono text-[11px] tracking-[0.14em] text-gold uppercase">
        Mainnet live
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
        Mainnet launched at {mainnetLaunchedAt}. There is no official binary
        release — clone tagged source{" "}
        <span className="font-mono text-ink">{protocol.launch.releaseTag}</span>,
        build it, and verify the software yourself.
      </p>
    </aside>
  );
}
