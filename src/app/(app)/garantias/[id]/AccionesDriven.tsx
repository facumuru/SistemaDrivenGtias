"use client";

import { startTransition, useActionState, useState } from "react";
import { accionDriven } from "../acciones";
import { ACCIONES_DRIVEN, MOTIVOS_NOTA_CREDITO, RESOLUCIONES, type Estado } from "@/lib/constantes";
import { Aviso } from "@/components/Aviso";

type Props = {
  garantia: {
    id: number;
    estado: string;
    resolucion: string | null;
    motivoResolucion: string | null;
    diagnostico: string | null;
    numeroNotaCredito: string | null;
    montoNotaCredito: number | null;
    remitoEnvio: string | null;
  };
};

const ESTILO = { primario: "btn-primario", secundario: "btn-secundario", peligro: "btn-peligro" };

export function AccionesDriven({ garantia }: Props) {
  const acciones = ACCIONES_DRIVEN[garantia.estado as Estado] ?? [];
  const [elegida, setElegida] = useState<number | null>(null);
  const [resolucion, setResolucion] = useState(garantia.resolucion ?? "");
  const [estado, despachar, enviando] = useActionState(accionDriven, undefined);

  const accion = elegida !== null ? acciones[elegida] : null;
  const pide = accion?.pide ?? [];
  const esNC = resolucion === "NOTA_CREDITO";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => despachar(fd));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {acciones.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={() => setElegida(elegida === i ? null : i)}
            className={`${ESTILO[a.estilo]} ${elegida === i ? "ring-4 ring-zinc-900/10" : ""}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {accion && (
        <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 text-tinta">
          <input type="hidden" name="garantiaId" value={garantia.id} />
          <input type="hidden" name="destino" value={accion.destino} />
          <h3 className="font-bold">{accion.label}</h3>

          {pide.includes("resolucion") && (
            <div>
              <label className="etiqueta">¿Cómo se resuelve? *</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {Object.entries(RESOLUCIONES).map(([k, v]) => (
                  <label
                    key={k}
                    className={`cursor-pointer rounded-xl border-2 p-3 transition ${resolucion === k ? "border-tinta bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"}`}
                  >
                    <input type="radio" name="resolucion" value={k} checked={resolucion === k} onChange={() => setResolucion(k)} className="sr-only" />
                    <div className="text-sm font-semibold">{v.label}</div>
                    <div className="text-xs text-zinc-500">{v.detalle}</div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {pide.includes("resolucion") && esNC && (
            <div>
              <label className="etiqueta">Motivo de la nota de crédito</label>
              <select name="motivoResolucion" defaultValue={garantia.motivoResolucion ?? MOTIVOS_NOTA_CREDITO[0]} className="campo">
                {MOTIVOS_NOTA_CREDITO.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {pide.includes("entrega") && esNC && (
            <div className="grid gap-3 rounded-xl bg-marca-claro p-4 sm:grid-cols-2">
              <div>
                <label className="etiqueta">N° de nota de crédito</label>
                <input name="numeroNotaCredito" defaultValue={garantia.numeroNotaCredito ?? ""} placeholder="NC-A-0001-00000000" className="campo" />
              </div>
              <div>
                <label className="etiqueta">Monto ($)</label>
                <input name="montoNotaCredito" inputMode="decimal" defaultValue={garantia.montoNotaCredito ?? ""} placeholder="Ej: 89.990" className="campo" />
              </div>
              <div className="sm:col-span-2">
                <label className="etiqueta">PDF de la nota de crédito</label>
                <input name="archivoNotaCredito" type="file" accept="application/pdf,image/*" className="campo text-xs" />
                <p className="mt-1 text-xs text-zinc-600">El distribuidor la va a poder descargar desde la garantía.</p>
              </div>
            </div>
          )}

          {pide.includes("entrega") && resolucion && !esNC && (
            <div className="grid gap-3 rounded-xl bg-zinc-50 p-4 sm:grid-cols-2">
              <div>
                <label className="etiqueta">N° de remito o seguimiento del envío</label>
                <input name="remitoEnvio" defaultValue={garantia.remitoEnvio ?? ""} placeholder="Ej: R-0001-00004567 / Andreani 3600..." className="campo" />
              </div>
              <div>
                <label className="etiqueta">Remito (opcional)</label>
                <input name="documentos" type="file" accept="application/pdf,image/*" className="campo text-xs" />
              </div>
            </div>
          )}

          {pide.includes("diagnostico") && (
            <div>
              <label className="etiqueta">Diagnóstico técnico</label>
              <textarea name="diagnostico" rows={2} defaultValue={garantia.diagnostico ?? ""} placeholder="¿Qué encontró el servicio técnico?" className="campo" />
            </div>
          )}

          {pide.includes("comentario") && (
            <div>
              <label className="etiqueta">
                Mensaje para el distribuidor {accion.comentarioObligatorio ? "*" : "(opcional)"}
              </label>
              <textarea name="comentario" rows={2} placeholder={accion.ayuda ?? "Lo va a ver en el historial de la garantía"} className="campo" />
            </div>
          )}

          {!pide.includes("entrega") && (
            <details className="text-sm">
              <summary className="cursor-pointer text-zinc-500">Adjuntar archivos (informe técnico, fotos)</summary>
              <input name="documentos" type="file" multiple className="campo mt-2 text-xs" />
            </details>
          )}

          <Aviso estado={estado} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setElegida(null)} className="btn-secundario">Cancelar</button>
            <button type="submit" disabled={enviando} className={ESTILO[accion.estilo === "peligro" ? "peligro" : "primario"]}>
              {enviando ? "Guardando..." : `Confirmar: ${accion.label.toLowerCase()}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
