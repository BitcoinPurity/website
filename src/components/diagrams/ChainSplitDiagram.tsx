export function ChainSplitDiagram() {
  return (
    <figure className="overflow-x-auto border border-line bg-surface px-5 py-6 sm:px-8">
      <figcaption className="sr-only">
        A Bitcoin transaction in a compatible format may be valid on a legacy
        history and a Purity history. Economic choice remains with users.
      </figcaption>
      <pre
        aria-hidden="true"
        className="min-w-[32rem] font-mono text-[11px] leading-6 tracking-[0.04em] text-ink sm:text-xs"
      >{`                  Bitcoin transaction
                          │
                  compatible format
                          │
                ┌─────────┴─────────┐
                │                   │
          Legacy history       Purity history
                │                   │
                └──── economic choice ────`}</pre>
    </figure>
  );
}
