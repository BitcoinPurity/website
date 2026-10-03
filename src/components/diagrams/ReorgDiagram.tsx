import { translator, type LocalizedProps } from "@/lib/i18n";
export function ReorgDiagram({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <figure className="overflow-x-auto border border-line bg-surface px-5 py-6 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.16em] text-gold uppercase">
        {t("Local policy — not consensus")}
      </div>
      <figcaption className="sr-only">
        {t(
          "If connecting a block would rewind the active chain by more than six blocks, the node parks that block for operator review instead of automatically reorganizing. This is local policy, not a consensus rule.",
        )}
      </figcaption>
      <pre
        aria-hidden="true"
        className="min-w-[34rem] font-mono text-[11px] leading-6 tracking-[0.04em] text-ink sm:text-xs"
      >
        {t(
          "ACTIVE CHAIN\nA → B → C → D → E → F → G\n\nCOMPETING CHAIN\nA → B → C → X → Y → Z → ...\n\nREORG DEPTH > 6\n        ↓\n      PARK\n        ↓\nOPERATOR REVIEW",
        )}
      </pre>
    </figure>
  );
}
