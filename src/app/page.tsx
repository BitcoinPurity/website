import { HashScroll } from "@/components/HashScroll";
import { HomePage } from "@/components/home/HomePage";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("Bitcoin Purity", "/");

export default function Page() {
  return (
    <>
      <HashScroll />
      <HomePage />
    </>
  );
}
