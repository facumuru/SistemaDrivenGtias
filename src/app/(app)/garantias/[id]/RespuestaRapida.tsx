"use client";

import { startTransition, useActionState } from "react";
import { enviarMensaje } from "../acciones";
import { Aviso } from "@/components/Aviso";

export function RespuestaRapida({ garantiaId }: { garantiaId: number }) {
  const [estado, despachar, enviando] = useActionState(enviarMensaje, undefined);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => despachar(fd));
      }}
      className="mt-4 space-y-3 rounded-2xl bg-white p-4 text-tinta"
    >
      <input type="hidden" name="garantiaId" value={garantiaId} />
      <label className="etiqueta">Tu respuesta</label>
      <textarea name="texto" rows={3} required placeholder="Escribí la información que pidió Driven…" className="campo" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="cursor-pointer text-xs text-zinc-600">
          📎 Adjuntar fotos o archivos
          <input name="adjuntos" type="file" multiple accept="image/*,application/pdf,video/mp4,video/quicktime" className="ml-2 text-xs" />
        </label>
        <button disabled={enviando} className="btn-marca">{enviando ? "Enviando..." : "Responder a Driven"}</button>
      </div>
      {estado?.error && <Aviso estado={estado} />}
    </form>
  );
}
