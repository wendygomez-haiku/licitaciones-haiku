import { NextResponse } from "next/server";
import { DEFAULT_BUCKET, isClosed, isOpen, type SecopRow } from "@/lib/secop";

export const runtime = "nodejs";

const DATASET_ID = "p6dx-8zbt";
const BASE_URL = `https://www.datos.gov.co/resource/${DATASET_ID}.json`;

const SELECT_COLS = [
  "id_del_proceso",
  "referencia_del_proceso",
  "entidad",
  "departamento_entidad",
  "ciudad_entidad",
  "nombre_del_procedimiento",
  "descripci_n_del_procedimiento",
  "modalidad_de_contratacion",
  "precio_base",
  "fase",
  "estado_de_apertura_del_proceso",
  "estado_del_procedimiento",
  "estado_resumen",
  "fecha_de_publicacion_del",
  "fecha_de_ultima_publicaci",
  "urlproceso",
].join(",");

function startIsoFromDays(days: number) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const yyyyMmDd = d.toISOString().slice(0, 10);
  return `${yyyyMmDd}T00:00:00.000`;
}

async function fetchKeyword(params: {
  keyword: string;
  startIso: string;
  limit: number;
}) {
  const { keyword, startIso, limit } = params;

  const url = new URL(BASE_URL);
  url.searchParams.set("$select", SELECT_COLS);
  url.searchParams.set("$where", `fecha_de_publicacion_del >= '${startIso}'`);
  url.searchParams.set("$q", keyword);
  url.searchParams.set("$limit", String(limit));
  url.searchParams.set("$order", "fecha_de_publicacion_del DESC");

  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.SODA_APP_TOKEN) {
    headers["X-App-Token"] = process.env.SODA_APP_TOKEN;
  }

  const res = await fetch(url.toString(), {
    headers,
    // en dev mejor no-store para ver cambios sin “fantasmas”
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Socrata error ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as SecopRow[];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawDays = Number(searchParams.get("days") ?? 7);
    const days = Math.min(
      7,
      Math.max(1, Number.isFinite(rawDays) ? rawDays : 7)
    );
    const scope = (searchParams.get("scope") ?? "active") as "active" | "open";
    const perKeywordLimit = Math.min(
      2000,
      Math.max(50, Number(searchParams.get("limit") ?? 200))
    );

    // Si pasas q=algo, buscamos solo eso; si no, usamos el bucket
    const q = (searchParams.get("q") ?? "").trim();
    const keywords = q ? [q] : [...DEFAULT_BUCKET];

    const startIso = startIsoFromDays(days);

    const results = await Promise.all(
      keywords.map(async (kw) => {
        const rows = await fetchKeyword({
          keyword: kw,
          startIso,
          limit: perKeywordLimit,
        });
        return { kw, rows };
      })
    );

    // Deduplicar por id y acumular keywords
    const byId = new Map<string, SecopRow>();
    const hits = new Map<string, Set<string>>();

    for (const { kw, rows } of results) {
      for (const r of rows) {
        const id = r.id_del_proceso;
        if (!id) continue;

        if (!byId.has(id)) byId.set(id, r);
        if (!hits.has(id)) hits.set(id, new Set());
        hits.get(id)!.add(kw);
      }
    }

    let out = Array.from(byId.entries()).map(([id, r]) => ({
      ...r,
      keyword_hit: Array.from(hits.get(id) ?? [])
        .sort()
        .join(", "),
    }));

    // Filtrar “open” o “active”
    out =
      scope === "open"
        ? out.filter((r) => isOpen(r))
        : out.filter((r) => !isClosed(r));

    // Ordenar por fecha desc
    out.sort((a, b) => {
      const da = Date.parse(a.fecha_de_publicacion_del ?? "") || 0;
      const db = Date.parse(b.fecha_de_publicacion_del ?? "") || 0;
      return db - da;
    });

    return NextResponse.json({
      meta: {
        days,
        scope,
        keywords,
        perKeywordLimit,
        fetchedAt: new Date().toISOString(),
      },
      results: out,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
