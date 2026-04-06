import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import type { CamaraResult, CameraSite } from "./types";
import { absUrl, matchesKeywords, normalizeSpace, toIsoMaybe } from "./fetchers";

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function asArray<T>(x: T | T[] | undefined): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

export function parseRss(site: CameraSite, sourceUrl: string, xmlText: string, keywords: string[]): CamaraResult[] {
  const parsed = xml.parse(xmlText);

  // RSS 2.0
  const items =
    asArray(parsed?.rss?.channel?.item) ||
    [];

  // Atom
  const entries = asArray(parsed?.feed?.entry);

  const out: CamaraResult[] = [];

  for (const it of items) {
    const title = normalizeSpace(it?.title);
    const link = normalizeSpace(it?.link);
    const pubDate = toIsoMaybe(it?.pubDate);

    const hay = `${title} ${link}`.toLowerCase();
    if (!matchesKeywords(hay, keywords)) continue;

    out.push({
      id: link || `${site.id}:${title}`,
      entidad: site.name,
      ciudad: site.city,
      titulo: title || "Sin título",
      url: link,
      publishedAt: pubDate,
      snippet: normalizeSpace(it?.description),
      source: "CAMARAS",
      sourceKind: "rss",
      sourceUrl,
    });
  }

  for (const e of entries) {
    const title = normalizeSpace(e?.title);
    // Atom link puede venir como objeto con @_.href
    const linkObj = asArray(e?.link)?.[0];
    const link = normalizeSpace(linkObj?.["@_href"] ?? linkObj);
    const updated = toIsoMaybe(e?.updated ?? e?.published);

    const hay = `${title} ${link}`.toLowerCase();
    if (!matchesKeywords(hay, keywords)) continue;

    out.push({
      id: link || `${site.id}:${title}`,
      entidad: site.name,
      ciudad: site.city,
      titulo: title || "Sin título",
      url: link,
      publishedAt: updated,
      snippet: normalizeSpace(e?.summary),
      source: "CAMARAS",
      sourceKind: "rss",
      sourceUrl,
    });
  }

  return out.filter((r) => !!r.url);
}

export function parseSitemapUrls(xmlText: string): Array<{ loc: string; lastmod?: string }> {
  const parsed = xml.parse(xmlText);

  // sitemap index
  const sitemaps = asArray(parsed?.sitemapindex?.sitemap);
  if (sitemaps.length) {
    return sitemaps
      .map((s: any) => ({ loc: String(s.loc ?? ""), lastmod: s.lastmod ? String(s.lastmod) : undefined }))
      .filter((x) => x.loc);
  }

  // urlset
  const urls = asArray(parsed?.urlset?.url);
  return urls
    .map((u: any) => ({ loc: String(u.loc ?? ""), lastmod: u.lastmod ? String(u.lastmod) : undefined }))
    .filter((x) => x.loc);
}

export function parsePageLinks(site: CameraSite, sourceUrl: string, html: string, keywords: string[]): CamaraResult[] {
  const $ = cheerio.load(html);
  const results: CamaraResult[] = [];

  const sourceU = new URL(sourceUrl);
  const IGNORE_TEXT = [
    "saltar al contenido",
    "ingresar",
    "login",
    "iniciar sesión",
    "inicio",
  ];

  function keywordInTextOrPath(text: string, urlStr: string) {
    const t = text.toLowerCase();
    try {
      const u = new URL(urlStr);
      const path = (u.pathname + " " + u.search).toLowerCase(); // SOLO path+query
      return matchesKeywords(t, keywords) || matchesKeywords(path, keywords);
    } catch {
      return matchesKeywords(t, keywords);
    }
  }

  $("a[href]").each((_, el) => {
    const hrefRaw = ($(el).attr("href") ?? "").trim();
    const text = normalizeSpace($(el).text());

    if (!hrefRaw) return;

    // ignora esquemas que no sirven
    if (/^(mailto:|tel:|javascript:)/i.test(hrefRaw)) return;

    const hrefAbs = absUrl(sourceUrl, hrefRaw);

    // ignora anchors (#...) y mismos links con hash
    try {
      const u = new URL(hrefAbs);
      const samePage =
        u.origin === sourceU.origin &&
        u.pathname === sourceU.pathname &&
        (u.hash && u.hash.length > 1);
      if (hrefRaw.startsWith("#") || samePage) return;
    } catch {
      // ignore
    }

    const isDoc = /\.(pdf|docx?|xlsx?)($|\?)/i.test(hrefAbs);

    // filtra textos genéricos (solo para pages, no para docs)
    if (!isDoc) {
      const t = text.toLowerCase();
      if (!text || text.length < 4) return;
      if (IGNORE_TEXT.some((x) => t.includes(x))) return;
    }

    // docs: los dejamos pasar (son lo importante)
    if (isDoc) {
      results.push({
        id: hrefAbs,
        entidad: site.name,
        ciudad: site.city,
        titulo: text || "Documento",
        url: hrefAbs,
        source: "CAMARAS",
        sourceKind: "page",
        sourceUrl,
        documents: [hrefAbs],
      });
      return;
    }

    // pages: solo si keyword aparece en texto o PATH (no en hostname)
    if (!keywordInTextOrPath(text, hrefAbs)) return;

    results.push({
      id: hrefAbs,
      entidad: site.name,
      ciudad: site.city,
      titulo: text || "Enlace",
      url: hrefAbs,
      source: "CAMARAS",
      sourceKind: "page",
      sourceUrl,
    });
  });

  return results;
}