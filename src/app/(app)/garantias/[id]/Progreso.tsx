import { ESTADOS, FLUJO_PRINCIPAL, type Estado } from "@/lib/constantes";
import { fecha } from "@/lib/formato";

export function Progreso({ estado, eventos }: { estado: Estado; eventos: { estado: string; fecha: Date }[] }) {
  const pasos: Estado[] = [...FLUJO_PRINCIPAL];
  if (estado === "RECHAZADA") pasos.splice(3, 2, "RECHAZADA");

  let actual = pasos.indexOf(estado);
  if (estado === "INFO_REQUERIDA") actual = pasos.indexOf("EN_REVISION");
  const terminado = estado === "FINALIZADA" || estado === "RECHAZADA";

  const fechaDe = (e: Estado) => {
    const buscado = e === "EN_REVISION" && estado === "INFO_REQUERIDA" ? "INFO_REQUERIDA" : e;
    return eventos
      .filter((ev) => ev.estado === buscado)
      .reduce<Date | undefined>((ultima, ev) => (!ultima || ev.fecha > ultima ? ev.fecha : ultima), undefined);
  };

  return (
    <ol className="flex items-start">
      {pasos.map((paso, i) => {
        const hecho = i < actual || (i === actual && terminado);
        const enCurso = i === actual && !terminado;
        const rojo = paso === "RECHAZADA";
        const f = fechaDe(paso);
        return (
          <li key={paso} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span className={`absolute top-3.5 right-1/2 h-0.5 w-full ${i <= actual ? (rojo ? "bg-red-500" : "bg-tinta") : "bg-zinc-200"}`} />
            )}
            <span
              className={`relative z-10 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                hecho ? (rojo ? "bg-red-500 text-white" : "bg-tinta text-white") : enCurso ? "bg-white text-tinta ring-4 ring-tinta" : "bg-zinc-200 text-zinc-500"
              }`}
            >
              {hecho ? (rojo ? "✕" : "✓") : i + 1}
            </span>
            <span className={`mt-2 text-[11px] leading-tight font-semibold sm:text-xs ${hecho || enCurso ? "text-tinta" : "text-zinc-400"}`}>
              {paso === "EN_REVISION" && estado === "INFO_REQUERIDA" ? "Falta información" : ESTADOS[paso].label}
            </span>
            {f && i <= actual && <span className="text-[10px] text-zinc-400">{fecha(f)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
