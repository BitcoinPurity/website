import { type LocalizedProps } from "@/lib/i18n";
import { HashScroll } from "@/components/HashScroll";
import { HomePage } from "@/components/home/HomePage";

export default function HomeView({ locale = "en" }: LocalizedProps = {}) {
  return (
    <>
      <HashScroll />
      <HomePage locale={locale} />
    </>
  );
}
