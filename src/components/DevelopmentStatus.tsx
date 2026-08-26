import { ExternalLink } from "@/components/ExternalLink";
import {
  binaryReleaseUrl,
  mainnetLaunchedAt,
  protocol,
} from "@/content/protocol";

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
        Mainnet launched at {mainnetLaunchedAt}. Official release{" "}
        <ExternalLink href={binaryReleaseUrl} className="font-mono text-gold">
          {protocol.launch.releaseTag}
        </ExternalLink>{" "}
        includes binaries; you can also clone that tag and build it yourself.
      </p>
    </aside>
  );
}
