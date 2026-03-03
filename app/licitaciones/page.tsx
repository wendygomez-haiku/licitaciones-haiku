"use client";

import { useEffect, useMemo, useState } from "react";

type SecopRow = {
  fecha_de_publicacion_del?: string;
  entidad?: string;
  nombre_del_procedimiento?: string;
  descripci_n_del_procedimiento?: string;
  fase?: string;
  estado_de_apertura_del_proceso?: string;
  estado_resumen?: string;
  precio_base?: string;
  keyword_hit?: string;
  urlproceso?: string | { url?: string };
  id_del_proceso?: string;
  ciudad_entidad?: string;
  departamento_entidad?: string;
};

export default function LicitacionesPage() {
  const [days, setDays] = useState(7);
  const [scope, setScope] = useState<"active" | "open">("active");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SecopRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("all");

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    params.set("scope", scope);
    if (q.trim()) params.set("q", q.trim());
    params.set("limit", "300");
    return `/api/licitaciones?${params.toString()}`;
  }, [days, scope, q]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const c = (r.ciudad_entidad ?? "").trim();
      if (c) set.add(c);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (city === "all") return rows;
    return rows.filter((r) => (r.ciudad_entidad ?? "").trim() === city);
  }, [rows, city]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error consultando API");
      setRows(data.results ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, scope]);

  function formatCOP(value?: string) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "—";
    return n.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });
  }

  function getProcesoUrl(u: SecopRow["urlproceso"]): string {
    if (!u) return "";
    if (typeof u === "string") return u;
    return typeof u === "object" && typeof u.url === "string" ? u.url : "";
  }

  return (
    <main className="min-h-screen p-8 bg-base-200">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="navbar bg-base-100 rounded-box shadow">
          <div className="flex-1 px-2 text-xl font-bold">
            Licitaciones – SECOP II
          </div>
          <button className="btn btn-primary" onClick={load} disabled={loading}>
            {loading ? "Cargando..." : "Refrescar"}
          </button>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body gap-4">
            <div className="flex flex-wrap gap-3 items-end">
              <label className="form-control w-40">
                <div className="label">
                  <span className="label-text">Días</span>
                </div>
                <select
                  className="select select-bordered"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                  <option value={7}>7</option>
                </select>
              </label>

              <label className="form-control w-56">
                <div className="label">
                  <span className="label-text">Ciudad</span>
                </div>
                <select
                  className="select select-bordered"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c === "all" ? "Todas" : c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control w-48">
                <div className="label">
                  <span className="label-text">Scope</span>
                </div>
                <select
                  className="select select-bordered"
                  value={scope}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "active" || v === "open") setScope(v);
                  }}
                >
                  <option value="active">Activas (no cerradas)</option>
                  <option value="open">Abiertas (heurística)</option>
                </select>
              </label>

              <label className="form-control flex-1 min-w-[240px]">
                <div className="label">
                  <span className="label-text">Buscar (opcional)</span>
                </div>
                <div className="join">
                  <input
                    className="input input-bordered join-item w-full"
                    placeholder='Ej: "publicidad", "pauta", "redes sociales"...'
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <button
                    className="btn join-item"
                    onClick={load}
                    disabled={loading}
                  >
                    Buscar
                  </button>
                </div>
              </label>
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Entidad</th>
                    <th>Descripción</th>
                    <th>Estado/Fase</th>
                    <th>Presupuesto</th>
                    <th>Keywords</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center opacity-70">
                        Sin resultados
                      </td>
                    </tr>
                  )}
                  {filteredRows.map((r) => (
                    <tr key={r.id_del_proceso ?? Math.random()}>
                      <td>{(r.fecha_de_publicacion_del ?? "").slice(0, 10)}</td>
                      <td className="font-semibold">{r.entidad}</td>
                      <td>
                        <div className="font-semibold">
                          {(r.nombre_del_procedimiento ?? "").slice(0, 10)}
                        </div>
                        <div className="opacity-70 text-sm line-clamp-3">
                          {r.descripci_n_del_procedimiento}
                        </div>
                        <div className="opacity-60 text-xs mt-1">
                          {r.id_del_proceso}
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-primary badge-xs px-4 py-2 mb-2 text-center">
                          {r.estado_de_apertura_del_proceso ?? "—"}
                        </div>
                        <div className="opacity-70 text-xs mt-1">
                          {" "}
                          <b>Fase: </b> {r.fase ?? "—"}
                        </div>
                        <div className="opacity-70 text-xs mt-1">
                          {" "}
                          <b>Estado: </b> {r.estado_resumen ?? "—"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        {formatCOP(r.precio_base)}
                      </td>
                      <td className="text-sm opacity-80">{r.keyword_hit}</td>
                      <td>
                        {(() => {
                          const link = getProcesoUrl(r.urlproceso);
                          return link ? (
                            <a
                              className="link link-primary"
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Abrir
                            </a>
                          ) : (
                            "—"
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-sm opacity-70">
              Tip: si no escribes nada en “Buscar”, usa tu bucket por defecto
              (agencia/marketing/etc.).
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
