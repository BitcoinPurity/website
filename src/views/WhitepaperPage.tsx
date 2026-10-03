import { translator, type LocalizedProps } from "@/lib/i18n";
import { Container } from "@/components/Container";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { WHITEPAPER_PDF } from "@/content/links";

export default function WhitepaperPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <>
      <PageHeader
        eyebrow={t("Document")}
        title={t("Whitepaper now available.")}
      >
        {t(
          "Browse the Bitcoin Purity whitepaper in the viewer below, or download the PDF.",
        )}
      </PageHeader>
      <Container className="py-10 sm:py-14">
        {locale !== "en" ? (
          <p className="mb-5 text-sm text-muted">
            {t("The PDF is displayed in its original language.")}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <DownloadPdfButton
            locale={locale}
            href={WHITEPAPER_PDF}
            className="inline-flex min-h-12 items-center bg-gold px-5 text-sm font-medium text-bg hover:bg-[#e0b122] disabled:opacity-60"
          >
            {t("Download PDF")}
          </DownloadPdfButton>
          <ExternalLink
            locale={locale}
            href={WHITEPAPER_PDF}
            className="inline-flex min-h-12 items-center border border-line px-5 text-sm text-ink hover:border-gold"
          >
            {t("Open in new tab")}
          </ExternalLink>
        </div>

        <div className="mt-8 overflow-hidden border border-line bg-surface">
          <iframe
            title={t("Bitcoin Purity whitepaper")}
            src={`${WHITEPAPER_PDF}#view=FitH`}
            className="block h-[min(80vh,56rem)] w-full bg-bg"
          />
        </div>
      </Container>
    </>
  );
}
