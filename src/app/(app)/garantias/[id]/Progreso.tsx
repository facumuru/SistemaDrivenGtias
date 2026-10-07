import { ESTADOS, FLUJO_PRINCIPAL, type Estado } from "@/lib/constantes";
import { fecha } from "@/lib/formato";

export function Progreso({ estado, eventos }: { estado: Estado; eventos: { estado: string; fecha: Date }[] }) {
  const pasos: Estado[] = [...FLUJO_PRINCIPAL];
  if (estado === "RECHAZADA") pasos.splice(3, 2, "RECHAZADA");

  let indiceActual = pasos.indexOf(estado);
  if (estado === "INFO_REQUERIDA") indiceActual = pasos.indexOf("EN_REVISION");

  const fechaDe = (e: Estado) => eventos.find((ev) => ev.estado === e)?.fecha;

  return (
    <div className="tarjeta overflow-x-auto p-5">
      <ol className="flex min-w-[560px] items-start">
        {pasos.map((paso, i) => {
          const hecho = i < indiceActual || (i === indiceActual && (paso === "FINALIZADA" || paso === "RECHAZADA"));
          const actual = i === indiceActual && !hecho;
          const rojo = paso === "RECHAZADA";
          const f = fechaDe(paso);
          return (
            <li key={paso} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && (
                <span className={`absolute top-4 right-1/2 h-0.5 w-full ${i <= indiceActual ? (rojo ? "bg-red-500" : "bg-marca") : "bg-zinc-200"}`} />
              )}
              <span
                className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
                  hecho
                    ? rojo
                      ? "bg-red-500 text-white"
                      : "bg-marca text-white"
                    : actual
                      ? "bg-white text-marca ring-4 ring-marca"
                      : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {hecho ? (rojo ? "✖" : "✓") : i + 1}
              </span>
              <span className={`mt-2 text-xs font-semibold ${actual || hecho ? "text-tinta" : "text-zinc-400"}`}>
                {paso === "EN_REVISION" && estado === "INFO_REQUERIDA" ? "Esperando info" : ESTADOS[paso].label}
              </span>
              {f && i <= indiceActual && <span className="text-[11px] text-zinc-400">{fecha(f)}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
