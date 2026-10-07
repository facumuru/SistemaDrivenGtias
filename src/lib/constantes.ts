export const ROLES = {
  DRIVEN_ADMIN: "Administrador Driven",
  DRIVEN_TECNICO: "Técnico Driven",
  DIST_ADMIN: "Administrador distribuidor",
  DIST_OPERADOR: "Operador distribuidor",
} as const;

export type Rol = keyof typeof ROLES;

export const esDriven = (rol: string) => rol === "DRIVEN_ADMIN" || rol === "DRIVEN_TECNICO";

export const ESTADOS = {
  CARGADA: { label: "Cargada", descripcion: "El distribuidor cargó el reclamo", color: "bg-slate-100 text-slate-700 ring-slate-300" },
  EQUIPO_RECIBIDO: { label: "Equipo recibido", descripcion: "Driven recibió el producto", color: "bg-sky-100 text-sky-800 ring-sky-300" },
  EN_REVISION: { label: "En revisión", descripcion: "El servicio técnico está evaluando el producto", color: "bg-amber-100 text-amber-800 ring-amber-300" },
  INFO_REQUERIDA: { label: "Info requerida", descripcion: "Driven necesita más datos del distribuidor", color: "bg-purple-100 text-purple-800 ring-purple-300" },
  APROBADA: { label: "Aprobada", descripcion: "La garantía fue aprobada", color: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  RECHAZADA: { label: "Rechazada", descripcion: "La garantía fue rechazada", color: "bg-red-100 text-red-800 ring-red-300" },
  FINALIZADA: { label: "Finalizada", descripcion: "Se entregó la resolución", color: "bg-zinc-800 text-white ring-zinc-800" },
} as const;

export type Estado = keyof typeof ESTADOS;

export const FLUJO_PRINCIPAL: Estado[] = ["CARGADA", "EQUIPO_RECIBIDO", "EN_REVISION", "APROBADA", "FINALIZADA"];

export const ESTADOS_ABIERTOS: Estado[] = ["CARGADA", "EQUIPO_RECIBIDO", "EN_REVISION", "INFO_REQUERIDA", "APROBADA"];

export const RESOLUCIONES = {
  CAMBIO_PRODUCTO: "Cambio por producto nuevo",
  REPARACION: "Reparación",
  NOTA_CREDITO: "Nota de crédito",
} as const;

export type Resolucion = keyof typeof RESOLUCIONES;

export const MOTIVOS_NOTA_CREDITO = [
  "Sin stock para reemplazo",
  "Producto discontinuado",
  "Reparación no viable",
  "Acuerdo comercial",
];

export const TIPOS_FALLA = {
  NO_ENCIENDE: "No enciende",
  NO_INFLA: "No infla / no levanta presión",
  PIERDE_AIRE: "Pierde aire",
  RUIDO: "Ruido anormal",
  SOBRECALENTAMIENTO: "Sobrecalentamiento",
  MANOMETRO: "Manómetro / display defectuoso",
  CABLE_CONECTOR: "Cable, ficha o pinzas",
  GOLPE_ROTURA: "Golpe o rotura física",
  OTRO: "Otro",
} as const;

export const TIPOS_DOCUMENTO = {
  FACTURA_COMPRA: "Factura de compra",
  FOTO: "Foto",
  VIDEO: "Video",
  NOTA_CREDITO: "Nota de crédito",
  INFORME_TECNICO: "Informe técnico",
  REMITO: "Remito",
  OTRO: "Otro",
} as const;

export const MAX_ARCHIVO_MB = 15;

export const numeroGarantia = (id: number) => `GAR-${String(id).padStart(5, "0")}`;
