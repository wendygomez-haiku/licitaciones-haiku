import { NextResponse } from "next/server";
import { CAMARAS_CATALOG } from "@/lib/camaras/catalog";
import { collectFromCamera } from "@/lib/camaras/collect";

export const runtime = "nodejs";

function clampDays(raw: number) {
  return raw === 1 || raw === 3 || raw === 7 ? raw : 7;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const days = clampDays(Number(searchParams.get("days") ?? "7"));
  const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") ?? "50")));
  const q = (searchParams.get("q") ?? "").trim(); // opcional: keyword extra
  const cameraId = (searchParams.get("camera") ?? "").trim(); // opcional: una cámara

  const keywords = q ? [q] : undefined;

  const catalog = cameraId
    ? CAMARAS_CATALOG.filter((c) => c.id === cameraId)
    : CAMARAS_CATALOG;

  // simple: procesar en paralelo con límite suave (para no matar sitios)
  const resultsArrays = await Promise.all(
    catalog.map((site) => collectFromCamera(site, { days, keywords }))
  );

  const flat = resultsArrays.flat();

  // dedupe global por url
  const byUrl = new Map<string, any>();
  for (const r of flat) {
    if (!byUrl.has(r.url)) byUrl.set(r.url, r);
  }

  const results = Array.from(byUrl.values()).slice(0, limit);

  return NextResponse.json({
    meta: {
      days,
      limit,
      cameraId: cameraId || "all",
      count: results.length,
    },
    results,
  });
}