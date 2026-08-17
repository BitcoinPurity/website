import type { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";
import type { StatusKind } from "@/content/status";

export function SpecificationRow({
  index,
  title,
  status,
  children,
}: {
  index: string;
  title: string;
  status: StatusKind;
  children: ReactNode;
}) {
  return (
    <article className="grid gap-3 border-t border-line py-7 md:grid-cols-[5.5rem_1fr_auto] md:items-start md:gap-8">
      <p className="font-mono text-sm tracking-[0.16em] text-gold">{index}</p>
      <div>
        <h3 className="text-xl text-ink sm:text-2xl">{title}</h3>
        <div className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-muted">
          {children}
        </div>
      </div>
      <div className="md:pt-1">
        <StatusBadge kind={status} />
      </div>
    </article>
  );
}
