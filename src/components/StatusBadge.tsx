import { statusLabel, type StatusKind } from "@/content/status";

const mark: Record<StatusKind, string> = {
  consensus: "■",
  unchanged: "□",
  "local-policy": "▨",
  implemented: "▮",
  "active-in-tree": "▮",
  specified: "▯",
  roadmap: "◇",
  safety: "▲",
};

export function StatusBadge({ kind }: { kind: StatusKind }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.08em] text-ink uppercase">
      <span aria-hidden="true" className="text-gold">
        {mark[kind]}
      </span>
      {statusLabel[kind]}
    </span>
  );
}
