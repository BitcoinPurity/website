export function ReorgDiagram() {
  return (
    <figure className="overflow-x-auto border border-line bg-surface px-5 py-6 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.16em] text-gold uppercase">
        Local policy — not consensus
      </div>
      <figcaption className="sr-only">
        If connecting a block would rewind the active chain by more than six
        blocks, the node parks that block for operator review instead of
        automatically reorganizing. This is local policy, not a consensus rule.
      </figcaption>
      <pre
        aria-hidden="true"
        className="min-w-[34rem] font-mono text-[11px] leading-6 tracking-[0.04em] text-ink sm:text-xs"
      >{`ACTIVE CHAIN
A → B → C → D → E → F → G

COMPETING CHAIN
A → B → C → X → Y → Z → ...

REORG DEPTH > 6
        ↓
      PARK
        ↓
OPERATOR REVIEW`}</pre>
    </figure>
  );
}
