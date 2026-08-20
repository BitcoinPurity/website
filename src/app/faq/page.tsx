import Link from "next/link";
import { Container } from "@/components/Container";
import { FAQAccordion } from "@/components/FAQAccordion";
import { PageHeader } from "@/components/PageHeader";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "FAQ",
  "/faq",
  "Answers about Bitcoin Purity: mainnet launch, not a new coin, hard fork rationale, replay behavior, hash-rate risk, and unimplemented protections.",
);

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="FAQ" title="Questions, answered from the repository.">
        If website copy and repository documentation ever diverge, the repository
        wins.{" "}
        <Link href="/safety" className="text-gold">
          Read Safety
        </Link>{" "}
        before treating any payment as final during the transition.
      </PageHeader>
      <Container className="py-16 sm:py-20">
        <FAQAccordion />
      </Container>
    </>
  );
}
