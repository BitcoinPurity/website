import type { ReactNode } from "react";
import { Container } from "./Container";
import { SectionEyebrow } from "./SectionEyebrow";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line">
      <Container className="py-16 sm:py-20">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h1 className="max-w-4xl text-4xl leading-[1.05] text-ink sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {children ? (
          <div className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{children}</div>
        ) : null}
      </Container>
    </header>
  );
}
