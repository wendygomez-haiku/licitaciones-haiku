export const DEFAULT_BUCKET = [
  "agencia",
  "campaña",
  "estrategia de comunicaciones",
  "plan de medios",
  "marketing digital",
  "pauta digital",
  "redes sociales",
  "community manager",
  "contenidos digitales",
] as const;

export type SecopRow = {
  id_del_proceso?: string;
  referencia_del_proceso?: string;
  entidad?: string;
  departamento_entidad?: string;
  ciudad_entidad?: string;
  nombre_del_procedimiento?: string;
  descripci_n_del_procedimiento?: string;
  modalidad_de_contratacion?: string;
  precio_base?: string;
  fase?: string;
  estado_de_apertura_del_proceso?: string;
  estado_del_procedimiento?: string;
  estado_resumen?: string;
  fecha_de_publicacion_del?: string;
  fecha_de_ultima_publicaci?: string;
  urlproceso?: string;
  keyword_hit?: string;
};

const CLOSED_RE =
  /\b(cerrad|adjudic|termin|finaliz|cancel|revoc|desiert|anul|suspend|expir)\b/i;

export function isClosed(r: SecopRow) {
  const hay = [
    r.estado_de_apertura_del_proceso,
    r.fase,
    r.estado_resumen,
    r.estado_del_procedimiento,
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  return CLOSED_RE.test(hay);
}

export function isOpen(r: SecopRow) {
  const hay = [
    r.estado_de_apertura_del_proceso,
    r.estado_de_apertura_del_proceso,
    r.fase,
    r.estado_resumen,
    r.estado_del_procedimiento,
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  // señal fuerte
  if (hay.includes("abierto")) return true;

  // heurística suave
  const openHints = [
    "abiert",
    "present",
    "oferta",
    "observ",
    "borrador",
    "aclar",
  ];
  const hasOpen = openHints.some((h) => hay.includes(h));
  return hasOpen && !isClosed(r);
}
