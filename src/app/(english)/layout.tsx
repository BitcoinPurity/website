import { SiteLayout, siteMetadata } from "@/components/SiteLayout";

export const metadata = siteMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
