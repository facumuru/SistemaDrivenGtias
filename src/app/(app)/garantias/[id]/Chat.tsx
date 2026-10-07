"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { enviarMensaje } from "../acciones";
import { Aviso } from "@/components/Aviso";

type Mensaje = { id: string; texto: string; autor: string; autorId: string; deDriven: boolean; fecha: string };

export function Chat({ garantiaId, usuarioId, mensajes }: { garantiaId: number; usuarioId: string; mensajes: Mensaje[] }) {
  const [estado, despachar, enviando] = useActionState(enviarMensaje, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estado?.ok) formRef.current?.reset();
  }, [estado]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensajes.length]);

  return (
    <section className="tarjeta overflow-hidden">
      <h2 className="border-b border-zinc-100 px-5 py-4 font-bold">💬 Conversación</h2>
      <div ref={listaRef} className="max-h-[28rem] space-y-3 overflow-y-auto bg-fondo p-5">
        {mensajes.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-500">
            Todavía no hay mensajes. Escribí acá cualquier consulta sobre esta garantía.
          </p>
        )}
        {mensajes.map((m) => {
          const propio = m.autorId === usuarioId;
          return (
            <div key={m.id} className={`flex ${propio ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  propio ? "rounded-br-md bg-tinta text-white" : "rounded-bl-md bg-white"
                }`}
              >
                <div className={`mb-0.5 text-[11px] font-semibold ${propio ? "text-zinc-400" : m.deDriven ? "text-marca-oscuro" : "text-zinc-500"}`}>
                  {propio ? "Vos" : m.autor}
                  {m.deDriven && !propio && " · Driven"}
                </div>
                <p className="whitespace-pre-line">{m.texto}</p>
                <div className={`mt-1 text-right text-[10px] ${propio ? "text-zinc-400" : "text-zinc-400"}`}>{m.fecha}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => despachar(fd));
        }}
        className="space-y-2 border-t border-zinc-100 p-4"
      >
        <input type="hidden" name="garantiaId" value={garantiaId} />
        <textarea
          name="texto"
          rows={2}
          placeholder="Escribí un mensaje…"
          className="campo"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <input
            name="adjuntos"
            type="file"
            multiple
            accept="image/*,application/pdf,video/mp4,video/quicktime"
            className="text-xs file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5"
          />
          <button disabled={enviando} className="btn-primario">{enviando ? "Enviando..." : "Enviar"}</button>
        </div>
        {estado?.error && <Aviso estado={estado} />}
      </form>
    </section>
  );
}
