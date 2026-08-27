/** Scroll so `id` sits just below the sticky site chrome. */
export function scrollToAnchor(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;

  const sticky = document.querySelector<HTMLElement>(".sticky.top-0");
  const offset = (sticky?.getBoundingClientRect().height ?? 0) + 12;
  const top = window.scrollY + el.getBoundingClientRect().top - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  return true;
}
