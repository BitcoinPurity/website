import { Container } from "@/components/Container";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { WHITEPAPER_PDF } from "@/content/links";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "Whitepaper",
  "/whitepaper",
  "Read and download the Bitcoin Purity whitepaper.",
);

export default function WhitepaperPage() {
  return (
    <>
      <PageHeader eyebrow="Document" title="Whitepaper now available.">
        Browse the Bitcoin Purity whitepaper in the viewer below, or download
        the PDF.
      </PageHeader>
      <Container className="py-10 sm:py-14">
        <div className="flex flex-wrap items-center gap-3">
          <DownloadPdfButton
            href={WHITEPAPER_PDF}
            className="inline-flex min-h-12 items-center bg-gold px-5 text-sm font-medium text-bg hover:bg-[#e0b122] disabled:opacity-60"
          >
            Download PDF
          </DownloadPdfButton>
          <ExternalLink
            href={WHITEPAPER_PDF}
            className="inline-flex min-h-12 items-center border border-line px-5 text-sm text-ink hover:border-gold"
          >
            Open in new tab
          </ExternalLink>
        </div>

        <div className="mt-8 overflow-hidden border border-line bg-surface">
          <iframe
            title="Bitcoin Purity whitepaper"
            src={`${WHITEPAPER_PDF}#view=FitH`}
            className="block h-[min(80vh,56rem)] w-full bg-bg"
          />
        </div>
      </Container>
    </>
  );
}
