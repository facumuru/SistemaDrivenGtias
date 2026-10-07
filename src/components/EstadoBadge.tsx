import { ESTADOS, type Estado } from "@/lib/constantes";

export function EstadoBadge({ estado }: { estado: string }) {
  const info = ESTADOS[estado as Estado] ?? ESTADOS.CARGADA;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${info.color}`}>
      {info.label}
    </span>
  );
}
