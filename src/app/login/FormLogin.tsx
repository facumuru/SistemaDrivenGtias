"use client";

import { useActionState, useRef } from "react";
import { iniciarSesion } from "./acciones";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

const DEMO = [
  { email: "admin@iturria.com.ar", quien: "ITURRIA · Gerencia", detalle: "Ve las 3 sucursales" },
  { email: "mdp@iturria.com.ar", quien: "ITURRIA · Mar del Plata", detalle: "Solo su sucursal" },
  { email: "bahia@iturria.com.ar", quien: "ITURRIA · Bahía Blanca", detalle: "Solo su sucursal" },
  { email: "tecnico@driven.com.ar", quien: "Driven · Servicio técnico", detalle: "Gestiona garantías" },
  { email: "admin@driven.com.ar", quien: "Driven · Administración", detalle: "Gestiona todo" },
];

export function FormLogin() {
  const [estado, accion] = useActionState(iniciarSesion, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const entrarComo = (email: string) => {
    const f = formRef.current;
    if (!f) return;
    (f.elements.namedItem("email") as HTMLInputElement).value = email;
    (f.elements.namedItem("password") as HTMLInputElement).value = "demo1234";
    f.requestSubmit();
  };

  return (
    <>
      <form ref={formRef} action={accion} className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="campo" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="campo" />
        </div>
        <Aviso estado={estado} />
        <BotonEnviar enviando="Ingresando..." className="btn-primario w-full py-3">Ingresar</BotonEnviar>
      </form>

      <div className="mt-10">
        <p className="titulo-seccion mb-3">Demo · entrar como</p>
        <div className="grid gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => entrarComo(d.email)}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-left transition hover:border-tinta"
            >
              <span>
                <span className="block text-sm font-semibold">{d.quien}</span>
                <span className="block text-xs text-zinc-500">{d.email}</span>
              </span>
              <span className="text-xs text-zinc-400">{d.detalle}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
