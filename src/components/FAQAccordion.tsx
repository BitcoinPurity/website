import { faqItems } from "@/content/faq";

export function FAQAccordion({ ids }: { ids?: readonly string[] }) {
  const items = ids
    ? faqItems.filter((item) => ids.includes(item.id))
    : [...faqItems];

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="cursor-pointer list-none py-5 text-lg text-ink marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-6">
              <span>{item.question}</span>
              <span aria-hidden="true" className="font-mono text-gold group-open:hidden">
                +
              </span>
              <span aria-hidden="true" className="hidden font-mono text-gold group-open:inline">
                −
              </span>
            </span>
          </summary>
          <p className="max-w-3xl pb-6 text-[1.02rem] leading-relaxed text-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
