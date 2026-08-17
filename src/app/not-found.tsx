import Link from "next/link";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="py-24">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">404</p>
      <h1 className="mt-4 text-4xl text-ink">This page is not here.</h1>
      <p className="mt-4 max-w-md text-muted">
        The document you requested is not part of bitcoinpurity.org.
      </p>
      <Link href="/" className="mt-8 inline-block text-gold">
        Return home
      </Link>
    </Container>
  );
}
