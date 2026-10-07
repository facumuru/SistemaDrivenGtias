import Link from "next/link";
import { TIPOS_FALLA, numeroGarantia } from "@/lib/constantes";
import { EstadoBadge, PuntoNovedad } from "./EstadoBadge";

export type DatosTarjeta = {
  id: number;
  estado: string;
  producto: string;
  tipoFalla: string;
  cliente: string;
  ubicacion?: string;
  dias: number;
  novedad: boolean;
};

export const diasDesde = (d: Date) => Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));

export function textoDias(dias: number) {
  return dias === 0 ? "hoy" : dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

export function TarjetaGarantia({ g, mostrarEstado = false }: { g: DatosTarjeta; mostrarEstado?: boolean }) {
  const demorada = g.dias >= 7;
  return (
    <Link
      href={`/garantias/${g.id}`}
      className={`block rounded-xl border bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        g.novedad ? "border-marca ring-1 ring-marca/40" : "border-zinc-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-wide text-zinc-500 tabular-nums">{numeroGarantia(g.id)}</span>
        <span className="flex items-center gap-1">
          {g.novedad && <PuntoNovedad />}
          {mostrarEstado && <EstadoBadge estado={g.estado} />}
        </span>
      </div>
      <div className="mt-1.5 text-sm leading-snug font-semibold">{g.producto}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{TIPOS_FALLA[g.tipoFalla as keyof typeof TIPOS_FALLA] ?? g.tipoFalla}</div>
      {g.ubicacion && <div className="mt-2 truncate text-xs font-medium text-marca-oscuro">{g.ubicacion}</div>}
      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="truncate">{g.cliente}</span>
        <span className={demorada ? "font-semibold text-red-600" : ""}>{textoDias(g.dias)}</span>
      </div>
    </Link>
  );
}
