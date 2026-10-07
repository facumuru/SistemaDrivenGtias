export const fecha = (d: Date | string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const fechaHora = (d: Date | string) =>
  new Date(d).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const pesos = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

export const tamanoArchivo = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function vencimientoGarantia(fechaCompra: Date, meses: number) {
  const vence = new Date(fechaCompra);
  vence.setMonth(vence.getMonth() + meses);
  return { vence, vigente: vence.getTime() >= Date.now() };
}
