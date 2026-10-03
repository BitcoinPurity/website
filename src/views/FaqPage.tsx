import { translator, localePath, type LocalizedProps } from "@/lib/i18n";
import Link from "next/link";
import { Container } from "@/components/Container";
import { FAQAccordion } from "@/components/FAQAccordion";
import { PageHeader } from "@/components/PageHeader";

export default function FaqPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <>
      <PageHeader
        eyebrow={t("FAQ")}
        title={t("Questions, answered from the repository.")}
      >
        {t(
          "If website copy and repository documentation ever diverge, the repository wins.",
        )}{" "}
        <Link href={localePath("/safety", locale)} className="text-gold">
          {t("Read Safety")}
        </Link>{" "}
        {t("before treating any payment as final during the transition.")}
      </PageHeader>
      <Container className="py-16 sm:py-20">
        <FAQAccordion locale={locale} />
      </Container>
    </>
  );
}
