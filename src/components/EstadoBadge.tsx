import { ESTADOS, type Estado } from "@/lib/constantes";

export function EstadoBadge({ estado, grande = false }: { estado: string; grande?: boolean }) {
  const info = ESTADOS[estado as Estado] ?? ESTADOS.CARGADA;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ring-1 ring-inset ${info.color} ${
        grande ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${estado === "FINALIZADA" ? "bg-white" : info.punto}`} />
      {info.label}
    </span>
  );
}

export function PuntoNovedad() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-marca px-2 py-0.5 text-[11px] font-bold text-white">
      Novedad
    </span>
  );
}
