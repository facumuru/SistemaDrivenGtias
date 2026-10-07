"use client";

import { useActionState } from "react";
import { iniciarSesion } from "./acciones";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

export function FormLogin() {
  const [estado, accion] = useActionState(iniciarSesion, undefined);
  return (
    <form action={accion} className="space-y-4">
      <div>
        <label className="etiqueta" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="campo" />
      </div>
      <div>
        <label className="etiqueta" htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="campo" />
      </div>
      <Aviso estado={estado} />
      <BotonEnviar enviando="Ingresando..." className="btn-primario w-full">Ingresar</BotonEnviar>
    </form>
  );
}
