import type { CamaraResult, CameraSite } from "./types";
import { fetchText, DEFAULT_KEYWORDS, withinDays, matchesKeywords } from "./fetchers";
import { parsePageLinks, parseRss, parseSitemapUrls } from "./parsers";

async function tryRss(site: CameraSite, url: string, days: number, keywords: string[]) {
  const xml = await fetchText(url);
  const items = parseRss(site, url, xml, keywords);
  return items.filter((x) => withinDays(x.publishedAt, days));
}

async function trySitemap(site: CameraSite, url: string, days: number, keywords: string[], maxUrls = 80) {
  const xml = await fetchText(url);
  const entries = parseSitemapUrls(xml);

  // Si es sitemapindex, entries son otros sitemaps. Los procesamos (limitados)
  const looksLikeIndex = entries.some((e) => e.loc.endsWith(".xml"));

  const urlEntries: Array<{ loc: string; lastmod?: string }> = [];

  if (looksLikeIndex) {
    const sub = entries.slice(0, 10); // no te vuelvas loca, 10 sitemaps max
    for (const s of sub) {
      try {
        const subXml = await fetchText(s.loc);
        const subUrls = parseSitemapUrls(subXml);
        urlEntries.push(...subUrls);
      } catch {
        // ignore
      }
    }
  } else {
    urlEntries.push(...entries);
  }

  // filtra rápido por keywords en la URL
  const candidates = urlEntries
    .filter((e) => matchesKeywords(e.loc.toLowerCase(), keywords))
    .slice(0, maxUrls);

  // conviértelo a resultados
  return candidates
    .map((e) => ({
      id: e.loc,
      entidad: site.name,
      ciudad: site.city,
      titulo: e.loc.split("/").pop() ?? "Página",
      url: e.loc,
      publishedAt: e.lastmod ? new Date(e.lastmod).toISOString() : undefined,
      source: "CAMARAS" as const,
      sourceKind: "sitemap" as const,
      sourceUrl: url,
      snippet: undefined,
    }))
    .filter((r) => withinDays(r.publishedAt, days));
}

async function tryPage(site: CameraSite, url: string, days: number, keywords: string[]) {
  const html = await fetchText(url);
  // en HTML usualmente no hay fecha fiable; solo filtramos por keywords
  const items = parsePageLinks(site, url, html, keywords);
  return items; // sin filtro por fecha en V1
}

export async function collectFromCamera(site: CameraSite, params: { days: number; keywords?: string[] }) {
  const days = params.days;
  const keywords = params.keywords?.length ? params.keywords : DEFAULT_KEYWORDS;

  const out: CamaraResult[] = [];

  // orden importante: RSS -> sitemap -> page
  for (const s of site.sources) {
    try {
      if (s.kind === "rss") out.push(...(await tryRss(site, s.url, days, keywords)));
      if (s.kind === "sitemap") out.push(...(await trySitemap(site, s.url, days, keywords)));
      if (s.kind === "page") out.push(...(await tryPage(site, s.url, days, keywords)));
    } catch {
      // falló esa fuente, seguimos con la siguiente
    }
  }

  // dedupe por url
  const byUrl = new Map<string, CamaraResult>();
  for (const r of out) {
    if (!r.url) continue;
    if (!byUrl.has(r.url)) byUrl.set(r.url, r);
  }

  return Array.from(byUrl.values());
}