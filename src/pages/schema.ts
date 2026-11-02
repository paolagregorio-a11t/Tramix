import type { RouteDef } from "../routes";
import { faqFor } from "./faq";

/** JSON-LD per page: breadcrumbs, FAQ (only when visible on the page) and the calculator as a free web app. */
export function schemaFor(r: RouteDef, site: string): object[] {
  const url = (p: string) => `${site}${p === "/" ? "/" : p}`;
  const out: object[] = [];
  if (r.crumbs.length > 1) out.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: r.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: url(c.path) })) });
  const faq = faqFor(r);
  if (faq.length) out.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  if (["cuota", "cuota-x", "regularizacion"].includes(r.kind)) out.push({ "@context": "https://schema.org", "@type": "WebApplication", name: r.title.split(" · ")[0], url: url(r.path), applicationCategory: "FinanceApplication", operatingSystem: "Web", inLanguage: "es-ES", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, publisher: { "@type": "Organization", name: "Cuotio", url: url("/") } });
  return out;
}
