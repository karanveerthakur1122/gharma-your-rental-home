import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  type?: string;
  noindex?: boolean;
}

/**
 * Lightweight SEO component that updates document head on mount.
 * Keeps titles under 60 chars and descriptions under 160 chars.
 */
export function SEOHead({ title, description, canonical, type = "website", noindex = false }: SEOHeadProps) {
  useEffect(() => {
    const suffix = " | GharKhoj Nepal";
    const fullTitle = title.length + suffix.length <= 60 ? `${title}${suffix}` : title;
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);

    if (noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      setMeta("name", "robots", "index, follow");
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }

    return () => {
      document.title = "GharKhoj Nepal — Find Verified Rental Rooms & Flats";
    };
  }, [title, description, canonical, type, noindex]);

  return null;
}
