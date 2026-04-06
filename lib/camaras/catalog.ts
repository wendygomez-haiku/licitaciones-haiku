import type { CameraSite } from "./types";

export const CAMARAS_CATALOG: CameraSite[] = [
  {
    id: "ccb",
    name: "Cámara de Comercio de Bogotá",
    city: "Bogotá",
    baseUrl: "https://www.ccb.org.co",
    sources: [
      { kind: "page", url: "https://www.ccb.org.co/camara-comercio-bogota/nosotros/portal-de-contratacion" },
      { kind: "sitemap", url: "https://www.ccb.org.co/sitemap.xml" },
    ],
  },
  {
    id: "ccm",
    name: "Cámara de Comercio de Medellín",
    city: "Medellín",
    baseUrl: "https://www.camaramedellin.com.co",
    sources: [
      { kind: "page", url: "https://www.camaramedellin.com.co/transparencia/contratacion" },
      { kind: "sitemap", url: "https://www.camaramedellin.com.co/sitemap.xml" },
    ],
  },
  {
    id: "cccali",
    name: "Cámara de Comercio de Cali",
    city: "Cali",
    baseUrl: "https://www.ccc.org.co",
    sources: [
      { kind: "page", url: "https://www.ccc.org.co/sede-virtual/proveedores/" },
      { kind: "sitemap", url: "https://www.ccc.org.co/sitemap.xml" },
    ],
  },
  {
    id: "ccbaq",
    name: "Cámara de Comercio de Barranquilla",
    city: "Barranquilla",
    baseUrl: "https://www.camarabaq.org.co",
    sources: [
      { kind: "page", url: "https://www.camarabaq.org.co/transparencia/contratacion/" },
      { kind: "sitemap", url: "https://www.camarabaq.org.co/sitemap.xml" },
    ],
  },
  {
    id: "cctunja",
    name: "Cámara de Comercio de Tunja",
    city: "Tunja",
    baseUrl: "https://cctunja.org.co",
    sources: [
      { kind: "page", url: "https://cctunja.org.co/proveedores/" },
      { kind: "sitemap", url: "https://cctunja.org.co/sitemap.xml" },
    ],
  },
];