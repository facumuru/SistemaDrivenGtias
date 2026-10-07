import type { EstadoForm } from "@/app/login/acciones";

export function Aviso({ estado }: { estado: EstadoForm }) {
  if (estado?.error)
    return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>;
  if (estado?.ok)
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{estado.ok}</p>
    );
  return null;
}
