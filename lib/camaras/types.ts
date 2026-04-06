export type CameraSource =
  | { kind: "rss"; url: string }
  | { kind: "sitemap"; url: string }
  | { kind: "page"; url: string };

export type CameraSite = {
  id: string;
  name: string;
  city?: string;
  baseUrl: string;
  sources: CameraSource[];
};

export type CamaraResult = {
  id: string; // dedupe id
  entidad: string;
  ciudad?: string;
  titulo: string;
  url: string;
  publishedAt?: string; // ISO
  snippet?: string;
  source: "CAMARAS";
  sourceKind: "rss" | "sitemap" | "page";
  sourceUrl: string; // desde dónde lo encontramos
  documents?: string[]; // links .pdf/.docx detectados
};