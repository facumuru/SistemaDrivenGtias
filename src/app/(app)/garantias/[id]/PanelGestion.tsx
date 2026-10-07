"use client";

import { useState } from "react";
import { gestionarGarantia } from "../acciones";
import { useFormSinReset } from "@/lib/useFormSinReset";
import { ESTADOS, MOTIVOS_NOTA_CREDITO, RESOLUCIONES, TIPOS_DOCUMENTO } from "@/lib/constantes";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

type Props = {
  garantia: {
    id: number;
    estado: string;
    resolucion: string | null;
    motivoResolucion: string | null;
    diagnostico: string | null;
    numeroNotaCredito: string | null;
    montoNotaCredito: number | null;
  };
};

export function PanelGestion({ garantia }: Props) {
  const { estado, onSubmit, pendiente } = useFormSinReset(gestionarGarantia);
  const [nuevoEstado, setNuevoEstado] = useState(garantia.estado);
  const [resolucion, setResolucion] = useState(garantia.resolucion ?? "");

  const pideResolucion = nuevoEstado === "APROBADA" || nuevoEstado === "FINALIZADA";
  const pideMotivo = nuevoEstado === "RECHAZADA" || nuevoEstado === "INFO_REQUERIDA";
  const esNC = pideResolucion && resolucion === "NOTA_CREDITO";

  return (
    <form onSubmit={onSubmit} className="tarjeta space-y-4 border-2 border-marca/40 p-5">
      <input type="hidden" name="garantiaId" value={garantia.id} />
      <h2 className="font-semibold">Gestión Driven</h2>

      <div>
        <label className="etiqueta">Estado</label>
        <select name="estado" className="campo" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">{ESTADOS[nuevoEstado as keyof typeof ESTADOS]?.descripcion}</p>
      </div>

      {pideResolucion && (
        <div>
          <label className="etiqueta">Resolución *</label>
          <select name="resolucion" className="campo" value={resolucion} onChange={(e) => setResolucion(e.target.value)}>
            <option value="">Seleccioná…</option>
            {Object.entries(RESOLUCIONES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      )}

      {esNC && (
        <div className="space-y-3 rounded-lg bg-orange-50 p-3">
          <div>
            <label className="etiqueta">Motivo</label>
            <select name="motivoResolucion" className="campo" defaultValue={garantia.motivoResolucion ?? MOTIVOS_NOTA_CREDITO[0]}>
              {MOTIVOS_NOTA_CREDITO.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="etiqueta">N° NC</label>
              <input name="numeroNotaCredito" className="campo" defaultValue={garantia.numeroNotaCredito ?? ""} placeholder="NC-A-0001-..." />
            </div>
            <div>
              <label className="etiqueta">Monto $</label>
              <input name="montoNotaCredito" inputMode="decimal" className="campo" defaultValue={garantia.montoNotaCredito ?? ""} />
            </div>
          </div>
          <div>
            <label className="etiqueta">PDF de la nota de crédito</label>
            <input name="archivoNotaCredito" type="file" accept="application/pdf,image/*" className="campo text-xs" />
          </div>
        </div>
      )}

      <div>
        <label className="etiqueta">Diagnóstico técnico</label>
        <textarea name="diagnostico" rows={2} className="campo" defaultValue={garantia.diagnostico ?? ""} placeholder="Resultado de la revisión del equipo" />
      </div>

      <div>
        <label className="etiqueta">Comentario para el distribuidor {pideMotivo && "*"}</label>
        <textarea
          name="comentario"
          rows={2}
          className="campo"
          placeholder={nuevoEstado === "RECHAZADA" ? "Motivo del rechazo" : nuevoEstado === "INFO_REQUERIDA" ? "¿Qué información necesitás?" : "Opcional"}
        />
      </div>

      <details className="rounded-lg border border-zinc-200 p-3">
        <summary className="cursor-pointer text-sm font-medium">Adjuntar otros documentos</summary>
        <div className="mt-3 space-y-2">
          <select name="tipoDocumento" className="campo" defaultValue="INFORME_TECNICO">
            {Object.entries(TIPOS_DOCUMENTO)
              .filter(([k]) => k !== "NOTA_CREDITO")
              .map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
          </select>
          <input name="documentos" type="file" multiple className="campo text-xs" />
        </div>
      </details>

      <Aviso estado={estado} />
      <BotonEnviar pendiente={pendiente} enviando="Actualizando..." className="btn-primario w-full">Guardar cambios</BotonEnviar>
    </form>
  );
}
