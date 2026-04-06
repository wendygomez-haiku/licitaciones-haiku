export async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; HaikuLicitacionesBot/1.0; +https://haiku.com.co)",
        accept: "text/html,application/xml,text/xml,*/*",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export function absUrl(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export function normalizeSpace(s: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

export const DEFAULT_KEYWORDS = [
  "convocatoria",
  "licitacion",
  "licitación",
  "invitacion",
  "invitación",
  "invitación pública",
  "contratacion",
  "contratación",
  "proveedores",
  "cotizacion",
  "cotización",
  "terminos de referencia",
  "términos de referencia",
];

export function matchesKeywords(text: string, keywords: string[]) {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

export function withinDays(isoOrDate: string | undefined, days: number) {
  if (!isoOrDate) return true; // si no hay fecha, lo dejamos pasar en V1 (marca "unknown")
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return true;
  const min = Date.now() - days * 24 * 60 * 60 * 1000;
  return d.getTime() >= min;
}

export function toIsoMaybe(value?: string) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}