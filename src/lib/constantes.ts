export const ROLES = {
  DRIVEN_ADMIN: "Administrador Driven",
  DRIVEN_TECNICO: "Técnico Driven",
  DIST_ADMIN: "Administrador",
  DIST_OPERADOR: "Operador",
} as const;

export type Rol = keyof typeof ROLES;

export const esDriven = (rol: string) => rol === "DRIVEN_ADMIN" || rol === "DRIVEN_TECNICO";

export const ESTADOS = {
  CARGADA: { label: "Nueva", color: "bg-sky-50 text-sky-800 ring-sky-200", punto: "bg-sky-500" },
  EQUIPO_RECIBIDO: { label: "Equipo recibido", color: "bg-indigo-50 text-indigo-800 ring-indigo-200", punto: "bg-indigo-500" },
  EN_REVISION: { label: "En revisión", color: "bg-amber-50 text-amber-800 ring-amber-200", punto: "bg-amber-500" },
  INFO_REQUERIDA: { label: "Falta información", color: "bg-purple-50 text-purple-800 ring-purple-200", punto: "bg-purple-500" },
  APROBADA: { label: "Aprobada", color: "bg-emerald-50 text-emerald-800 ring-emerald-200", punto: "bg-emerald-500" },
  RECHAZADA: { label: "Rechazada", color: "bg-red-50 text-red-800 ring-red-200", punto: "bg-red-500" },
  FINALIZADA: { label: "Finalizada", color: "bg-zinc-800 text-white ring-zinc-800", punto: "bg-zinc-800" },
} as const;

export type Estado = keyof typeof ESTADOS;

export const FLUJO_PRINCIPAL: Estado[] = ["CARGADA", "EQUIPO_RECIBIDO", "EN_REVISION", "APROBADA", "FINALIZADA"];

export const GRUPOS = {
  EN_CURSO: { label: "En curso", estados: ["CARGADA", "EQUIPO_RECIBIDO", "EN_REVISION", "INFO_REQUERIDA", "APROBADA"] },
  FINALIZADAS: { label: "Finalizadas", estados: ["FINALIZADA"] },
  RECHAZADAS: { label: "Rechazadas", estados: ["RECHAZADA"] },
} as const satisfies Record<string, { label: string; estados: Estado[] }>;

export const PENDIENTES_DRIVEN: Estado[] = ["CARGADA", "EQUIPO_RECIBIDO", "EN_REVISION", "APROBADA"];
export const PENDIENTES_DIST: Estado[] = ["INFO_REQUERIDA"];

/** Texto principal y siguiente paso, según quién mira la garantía. */
export const QUE_SIGUE: Record<Estado, { titulo: string; dist: string; driven: string }> = {
  CARGADA: {
    titulo: "Garantía cargada",
    dist: "Enviá el equipo a Driven con su caja y accesorios. Escribí el número de garantía en el paquete o imprimí el comprobante.",
    driven: "Esperando que llegue el equipo. Cuando lo recibas, marcalo como recibido.",
  },
  EQUIPO_RECIBIDO: {
    titulo: "Driven recibió el equipo",
    dist: "El equipo ya está en Driven. En breve el servicio técnico lo va a revisar.",
    driven: "El equipo está en depósito. Cuando empieces a revisarlo, marcalo en revisión.",
  },
  EN_REVISION: {
    titulo: "En revisión técnica",
    dist: "El servicio técnico está probando el equipo. Te avisamos apenas haya una decisión.",
    driven: "Decidí si la garantía corresponde. Si te falta algún dato, pedíselo al distribuidor.",
  },
  INFO_REQUERIDA: {
    titulo: "Driven necesita más información",
    dist: "Respondé la consulta de Driven. Apenas respondas, la garantía vuelve a revisión.",
    driven: "Esperando la respuesta del distribuidor.",
  },
  APROBADA: {
    titulo: "Garantía aprobada",
    dist: "Driven aprobó la garantía y está preparando la resolución.",
    driven: "Entregá la resolución: enviá el reemplazo, la reparación o cargá la nota de crédito.",
  },
  RECHAZADA: {
    titulo: "Garantía rechazada",
    dist: "La garantía no corresponde. Abajo vas a ver el motivo. Si no estás de acuerdo, escribí en la conversación.",
    driven: "Garantía cerrada como rechazada. Podés reabrirla si es necesario.",
  },
  FINALIZADA: {
    titulo: "Garantía resuelta",
    dist: "El trámite terminó. Abajo tenés el detalle de la resolución y los comprobantes.",
    driven: "Trámite terminado. Podés actualizar los datos de la resolución si hace falta.",
  },
};

export type AccionDriven = {
  destino: Estado;
  label: string;
  estilo: "primario" | "secundario" | "peligro";
  pide?: ("comentario" | "resolucion" | "entrega" | "diagnostico")[];
  comentarioObligatorio?: boolean;
  ayuda?: string;
};

export const ACCIONES_DRIVEN: Record<Estado, AccionDriven[]> = {
  CARGADA: [
    { destino: "EQUIPO_RECIBIDO", label: "Recibimos el equipo", estilo: "primario", pide: ["comentario"] },
    { destino: "INFO_REQUERIDA", label: "Pedir información", estilo: "secundario", pide: ["comentario"], comentarioObligatorio: true, ayuda: "¿Qué necesitás que te envíe el distribuidor?" },
    { destino: "RECHAZADA", label: "Rechazar", estilo: "peligro", pide: ["comentario", "diagnostico"], comentarioObligatorio: true, ayuda: "Explicá el motivo del rechazo." },
  ],
  EQUIPO_RECIBIDO: [
    { destino: "EN_REVISION", label: "Empezar revisión", estilo: "primario", pide: ["comentario"] },
    { destino: "INFO_REQUERIDA", label: "Pedir información", estilo: "secundario", pide: ["comentario"], comentarioObligatorio: true, ayuda: "¿Qué necesitás que te envíe el distribuidor?" },
  ],
  EN_REVISION: [
    { destino: "APROBADA", label: "Aprobar garantía", estilo: "primario", pide: ["resolucion", "diagnostico", "comentario"] },
    { destino: "INFO_REQUERIDA", label: "Pedir información", estilo: "secundario", pide: ["comentario"], comentarioObligatorio: true, ayuda: "¿Qué necesitás que te envíe el distribuidor?" },
    { destino: "RECHAZADA", label: "Rechazar", estilo: "peligro", pide: ["diagnostico", "comentario"], comentarioObligatorio: true, ayuda: "Explicá el motivo del rechazo." },
  ],
  INFO_REQUERIDA: [
    { destino: "EN_REVISION", label: "Retomar revisión", estilo: "primario", pide: ["comentario"] },
    { destino: "RECHAZADA", label: "Rechazar", estilo: "peligro", pide: ["diagnostico", "comentario"], comentarioObligatorio: true, ayuda: "Explicá el motivo del rechazo." },
  ],
  APROBADA: [
    { destino: "FINALIZADA", label: "Entregar resolución", estilo: "primario", pide: ["resolucion", "entrega", "comentario"] },
  ],
  RECHAZADA: [{ destino: "EN_REVISION", label: "Reabrir garantía", estilo: "secundario", pide: ["comentario"], comentarioObligatorio: true, ayuda: "¿Por qué se reabre?" }],
  FINALIZADA: [{ destino: "FINALIZADA", label: "Actualizar resolución", estilo: "secundario", pide: ["resolucion", "entrega", "comentario"] }],
};

export const RESOLUCIONES = {
  CAMBIO_PRODUCTO: { label: "Cambio por producto nuevo", detalle: "Driven envía un producto nuevo" },
  REPARACION: { label: "Reparación", detalle: "Driven repara y devuelve el equipo" },
  NOTA_CREDITO: { label: "Nota de crédito", detalle: "Por falta de stock u otro motivo" },
} as const;

export type Resolucion = keyof typeof RESOLUCIONES;

export const MOTIVOS_NOTA_CREDITO = ["Sin stock para reemplazo", "Producto discontinuado", "Reparación no viable", "Acuerdo comercial"];

export const TIPOS_FALLA = {
  NO_ENCIENDE: "No enciende",
  NO_INFLA: "No infla / no levanta presión",
  PIERDE_AIRE: "Pierde aire",
  RUIDO: "Ruido anormal",
  SOBRECALENTAMIENTO: "Se sobrecalienta / se corta",
  MANOMETRO: "Manómetro o display",
  CABLE_CONECTOR: "Cable, ficha o pinzas",
  GOLPE_ROTURA: "Golpe o rotura",
  OTRO: "Otro problema",
} as const;

export const TIPOS_DOCUMENTO = {
  FACTURA_COMPRA: "Factura de compra",
  FOTO: "Foto",
  VIDEO: "Video",
  NOTA_CREDITO: "Nota de crédito",
  INFORME_TECNICO: "Informe técnico",
  REMITO: "Remito",
  OTRO: "Archivo",
} as const;

export const MAX_ARCHIVO_MB = 15;

export const numeroGarantia = (id: number) => `GAR-${String(id).padStart(5, "0")}`;
