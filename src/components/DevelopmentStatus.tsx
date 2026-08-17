export function DevelopmentStatus({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`border-l-2 border-gold bg-surface px-5 py-4 ${className}`.trim()}
      aria-label="Development status"
    >
      <p className="font-mono text-[11px] tracking-[0.14em] text-gold uppercase">
        Under development
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
        Bitcoin Purity is actively under development. There is no live mainnet
        launch yet — this site describes the protocol and source tree, not a
        production network.
      </p>
    </aside>
  );
}
