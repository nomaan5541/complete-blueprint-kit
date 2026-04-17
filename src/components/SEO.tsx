import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  jsonLd?: object | object[];
}

/**
 * Lightweight per-page SEO manager. Sets <title>, meta description,
 * canonical URL, optional keywords, and JSON-LD structured data.
 * Reverts changes on unmount so other routes keep their own SEO.
 */
export default function SEO({ title, description, canonical, keywords, jsonLd }: SEOProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      const created = !el;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute("content") ?? "";
      el.setAttribute("content", content);
      return () => {
        if (created) el?.remove();
        else el?.setAttribute("content", prev);
      };
    };

    const restorers: Array<() => void> = [];
    restorers.push(setMeta("description", description));
    restorers.push(setMeta("og:title", title, "property"));
    restorers.push(setMeta("og:description", description, "property"));
    restorers.push(setMeta("twitter:title", title));
    restorers.push(setMeta("twitter:description", description));
    if (keywords) restorers.push(setMeta("keywords", keywords));

    // Canonical
    let canonicalEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonicalCreated = !canonicalEl;
    const prevHref = canonicalEl?.getAttribute("href") ?? "";
    const href = canonical ?? window.location.href.split("#")[0].split("?")[0];
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.rel = "canonical";
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", href);

    // JSON-LD
    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.text = JSON.stringify(jsonLd);
      scriptEl.dataset.seo = "page";
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = prevTitle;
      restorers.forEach((r) => r());
      if (canonicalCreated) canonicalEl?.remove();
      else canonicalEl?.setAttribute("href", prevHref);
      scriptEl?.remove();
    };
  }, [title, description, canonical, keywords, JSON.stringify(jsonLd)]);

  return null;
}
