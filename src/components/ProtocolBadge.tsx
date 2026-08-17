export function ProtocolBadge({ children }: { children: string }) {
  return (
    <span className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
      {children}
    </span>
  );
}
