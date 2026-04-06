"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";

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
  const [queryInput, setQueryInput] = useState("");
  const [queryChips, setQueryChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SecopRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("all");
  const [priceOrder, setPriceOrder] = useState<"none" | "asc" | "desc">("none");
  const [entity, setEntity] = useState("all");
  type Tab = "secop" | "camaras" | "all";
  const [tab, setTab] = useState<Tab>("secop");

  type CamaraRow = {
    id: string;
    entidad: string;
    ciudad?: string;
    titulo: string;
    url: string;
    publishedAt?: string;
    sourceKind: "rss" | "sitemap" | "page";
    documents?: string[];
  };

  const [secopRows, setSecopRows] = useState<SecopRow[]>([]);
  const [camaraRows, setCamaraRows] = useState<CamaraRow[]>([]);

  const entities = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const e = (r.entidad ?? "").trim();
      if (e) set.add(e);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [rows]);

  function normalizeChip(s: string) {
    return s.trim().replace(/\s+/g, " ");
  }

  function addChip(raw: string) {
    const chip = normalizeChip(raw);
    if (!chip) return;

    setQueryChips((prev) => {
      const exists = prev.some((p) => p.toLowerCase() === chip.toLowerCase());
      return exists ? prev : [...prev, chip];
    });
    setQueryInput("");
  }

  function removeChip(chip: string) {
    setQueryChips((prev) => prev.filter((p) => p !== chip));
  }

  function toPriceNumber(v?: string) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    params.set("scope", scope);
    params.set("limit", "300");

    // chips => q=...&q=...
    for (const chip of queryChips) {
      params.append("q", chip);
    }

    return `/api/licitaciones?${params.toString()}`;
  }, [days, scope, queryChips]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const c = (r.ciudad_entidad ?? "").trim();
      if (c) set.add(c);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;

    if (city !== "all") {
      list = list.filter((r) => (r.ciudad_entidad ?? "").trim() === city);
    }

    if (entity !== "all") {
      list = list.filter((r) => (r.entidad ?? "").trim() === entity);
    }

    if (priceOrder === "none") return list;

    const sorted = [...list].sort((a, b) => {
      const pa = toPriceNumber(a.precio_base);
      const pb = toPriceNumber(b.precio_base);
      return priceOrder === "asc" ? pa - pb : pb - pa;
    });

    return sorted;
  }, [rows, city, entity, priceOrder]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (tab === "secop") {
        const res = await fetch(secopUrl);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Error SECOP");
        setSecopRows(data.results ?? []);
        setRows(data.results ?? []);
        return;
      }

      if (tab === "camaras") {
        const res = await fetch(camarasUrl);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Error CÁMARAS");
        setCamaraRows(data.results ?? []);
        return;
      }

      // ALL: paralelo
      const [r1, r2] = await Promise.all([fetch(secopUrl), fetch(camarasUrl)]);
      const d1 = await r1.json();
      const d2 = await r2.json();
      if (!r1.ok) throw new Error(d1?.error ?? "Error SECOP");
      if (!r2.ok) throw new Error(d2?.error ?? "Error CÁMARAS");
      setSecopRows(d1.results ?? []);
      setRows(d1.results ?? []); 
      setCamaraRows(d2.results ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, scope, queryChips, tab]);

  useEffect(() => {
    setCity("all");
    setEntity("all");
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

  const secopUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    params.set("scope", scope);
    params.set("limit", "300");
    // si usas chips:
    for (const chip of queryChips) params.append("q", chip);
    return `/api/licitaciones?${params.toString()}`;
  }, [days, scope, queryChips]);

  const camarasUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    params.set("limit", "100");
    // si quieres aplicar chips también a cámaras:
    for (const chip of queryChips) params.append("q", chip);
    return `/api/camaras?${params.toString()}`;
  }, [days, queryChips]);

  function isDoc(r: CamaraRow) {
    return (r.documents?.length ?? 0) > 0 || /\.(pdf|docx?|xlsx?)($|\?)/i.test(r.url);
  }

  return (
    <main className="min-h-screen p-8 bg-base-200">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="navbar bg-base-100 rounded-box shadow">
          <div className="flex-1 px-2 text-xl font-bold">
            Licitaciones – SECOP II
          </div>
          <div role="tablist" className="tabs tabs-lifted">
            <button role="tab" className={`tab ${tab === "secop" ? "tab-active" : ""}`} onClick={() => setTab("secop")}>
              SECOP
            </button>
            <button role="tab" className={`tab ${tab === "camaras" ? "tab-active" : ""}`} onClick={() => setTab("camaras")}>
              Cámaras
            </button>
            <button role="tab" className={`tab ${tab === "all" ? "tab-active" : ""}`} onClick={() => setTab("all")}>
              Todo
            </button>
          </div>
          <button className="btn btn-primary" onClick={load} disabled={loading}>
            {loading ? "Cargando..." : "Refrescar"}
          </button>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body gap-4">
            <div className="flex flex-wrap gap-3 items-end">
               
              <label className="form-control w-20">
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

              <label className="form-control w-80">
                <div className="label">
                  <span className="label-text">Entidad</span>
                </div>
                <select
                  className="select select-bordered"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                >
                  {entities.map((e) => (
                    <option key={e} value={e}>
                      {e === "all" ? "Todas" : e}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control w-56">
                <div className="label">
                  <span className="label-text">Orden por precio</span>
                </div>
                <select
                  className="select select-bordered"
                  value={priceOrder}
                  onChange={(e) => setPriceOrder(e.target.value as "none" | "asc" | "desc")}
                >
                  <option value="none">Sin orden</option>
                  <option value="asc">Menor a mayor</option>
                  <option value="desc">Mayor a menor</option>
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

              <label className="grid form-control flex-1 min-w-[240px]">
                <div className="label">
                  <span className="label-text">Buscar (chips)</span>
                </div>
                <div className="join">
                  <input
                    className="input input-bordered join-item w-full"
                    placeholder='Palabra clave'
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChip(queryInput);
                      }
                    }}
                  />
                  <button
                    className="btn join-item rounded-full"
                    onClick={() => addChip(queryInput)}
                    disabled={loading}
                    type="button"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    className="btn join-item rounded-full"
                    onClick={load}
                    disabled={loading}
                    type="button"
                  >
                    <Search size={15} />
                  </button>
                </div>
              </label>

             
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            {/* Chips */}
            {queryChips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {queryChips.map((chip) => (
                  <div key={chip} className="badge badge-outline gap-2 py-3">
                    <span>{chip}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => removeChip(chip)}
                      aria-label={`Eliminar ${chip}`}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setQueryChips([])}
                >
                  Limpiar
                </button>
              </div>
            )}
            {tab === "camaras" && (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cámara</th>
                      <th>Ciudad</th>
                      <th>Tipo</th>
                      <th>Título</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && camaraRows.length === 0 && (
                      <tr><td colSpan={6} className="text-center opacity-70">Sin resultados</td></tr>
                    )}
                    {camaraRows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.publishedAt ? r.publishedAt.slice(0, 10) : "—"}</td>
                        <td className="font-semibold">{r.entidad}</td>
                        <td>{r.ciudad ?? "—"}</td>
                        <td>
                          <span className={`badge ${isDoc(r) ? "badge-primary" : "badge-outline"}`}>
                            {isDoc(r) ? "Documento" : "Página"}
                          </span>
                        </td>
                        <td className="max-w-[420px]">
                          <div className="truncate">{r.titulo}</div>
                        </td>
                        <td>
                          <a className="link link-primary" href={r.url} target="_blank" rel="noreferrer">
                            Abrir
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === "secop" && (
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
            )}
            {tab === "all" && (
              <div className="space-y-8">
                {/* SECOP */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">SECOP</h2>
                  <span className="badge badge-outline">{filteredRows.length} resultados</span>
                </div>

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

                <div className="divider" />

                {/* CÁMARAS */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Cámaras de Comercio</h2>
                  <span className="badge badge-outline">{camaraRows.length} resultados</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Cámara</th>
                        <th>Ciudad</th>
                        <th>Tipo</th>
                        <th>Título</th>
                        <th>Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!loading && camaraRows.length === 0 && (
                        <tr><td colSpan={6} className="text-center opacity-70">Sin resultados</td></tr>
                      )}
                      {camaraRows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.publishedAt ? r.publishedAt.slice(0, 10) : "—"}</td>
                          <td className="font-semibold">{r.entidad}</td>
                          <td>{r.ciudad ?? "—"}</td>
                          <td>
                            <span className={`badge ${isDoc(r) ? "badge-primary" : "badge-outline"}`}>
                              {isDoc(r) ? "Documento" : "Página"}
                            </span>
                          </td>
                          <td className="max-w-[420px]">
                            <div className="truncate">{r.titulo}</div>
                          </td>
                          <td>
                            <a className="link link-primary" href={r.url} target="_blank" rel="noreferrer">
                              Abrir
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
