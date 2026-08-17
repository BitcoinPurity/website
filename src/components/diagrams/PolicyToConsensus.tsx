export function PolicyToConsensus() {
  const steps = [
    "NODE POLICY",
    "TEMPORARY REDUCED-DATA RULES",
    "BITCOIN PURITY CONSENSUS\nPERMANENT REDUCED-DATA RULES",
  ];

  return (
    <figure className="border border-line bg-surface px-5 py-6 sm:px-8">
      <figcaption className="sr-only">
        Policy can change. Temporary Reduced Data rules become Bitcoin Purity
        consensus as permanent Reduced Data rules.
      </figcaption>
      <ol className="space-y-0 font-mono text-xs tracking-[0.12em] text-ink uppercase sm:text-sm" aria-hidden="true">
        {steps.map((step, index) => (
          <li key={step} className="whitespace-pre-line">
            {step}
            {index < steps.length - 1 ? (
              <div className="my-3 pl-1 text-gold">↓</div>
            ) : null}
          </li>
        ))}
      </ol>
    </figure>
  );
}
