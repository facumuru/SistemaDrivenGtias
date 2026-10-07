"use client";

import { useActionState, useEffect, useRef } from "react";
import { enviarMensaje } from "../acciones";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

type Mensaje = { id: string; texto: string; autor: string; autorId: string; deDriven: boolean; fecha: string };

export function Chat({ garantiaId, usuarioId, mensajes }: { garantiaId: number; usuarioId: string; mensajes: Mensaje[] }) {
  const [estado, accion] = useActionState(enviarMensaje, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estado?.ok) formRef.current?.reset();
  }, [estado]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensajes.length]);

  return (
    <section className="tarjeta">
      <h2 className="border-b border-zinc-100 px-5 py-3 font-semibold">Conversación</h2>
      <div ref={listaRef} className="max-h-96 space-y-3 overflow-y-auto bg-zinc-50 p-5">
        {mensajes.length === 0 && (
          <p className="text-center text-sm text-zinc-500">Todavía no hay mensajes. Usá este chat para cualquier consulta sobre la garantía.</p>
        )}
        {mensajes.map((m) => {
          const propio = m.autorId === usuarioId;
          return (
            <div key={m.id} className={`flex ${propio ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  propio ? "rounded-br-sm bg-marca text-white" : "rounded-bl-sm bg-white"
                }`}
              >
                <div className={`mb-0.5 text-[11px] font-semibold ${propio ? "text-orange-100" : "text-zinc-500"}`}>
                  {m.autor} {m.deDriven && !propio && "· Driven"}
                </div>
                <p className="whitespace-pre-line">{m.texto}</p>
                <div className={`mt-1 text-right text-[10px] ${propio ? "text-orange-100" : "text-zinc-400"}`}>{m.fecha}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form ref={formRef} action={accion} className="space-y-2 border-t border-zinc-100 p-4">
        <input type="hidden" name="garantiaId" value={garantiaId} />
        <textarea name="texto" rows={2} placeholder="Escribí un mensaje…" className="campo" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <input name="adjuntos" type="file" multiple accept="image/*,application/pdf,video/mp4,video/quicktime" className="text-xs file:mr-2 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1" />
          <BotonEnviar enviando="Enviando...">Enviar</BotonEnviar>
        </div>
        {estado?.error && <Aviso estado={estado} />}
      </form>
    </section>
  );
}
