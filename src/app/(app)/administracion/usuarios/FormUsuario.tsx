"use client";

import { useActionState } from "react";
import { crearUsuario } from "../acciones";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

export function FormUsuario() {
  const [estado, accion] = useActionState(crearUsuario, undefined);
  return (
    <form action={accion} className="tarjeta h-fit space-y-3 p-5">
      <h2 className="font-bold">+ Agregar persona de Driven</h2>
      <input name="nombre" placeholder="Nombre y apellido *" required className="campo" />
      <input name="email" type="email" placeholder="Email *" required className="campo" />
      <input name="password" type="text" placeholder="Contraseña inicial * (mín. 8)" required minLength={8} className="campo" />
      <select name="rol" className="campo" defaultValue="DRIVEN_TECNICO">
        <option value="DRIVEN_TECNICO">Técnico: gestiona garantías</option>
        <option value="DRIVEN_ADMIN">Administrador: además distribuidores, productos y usuarios</option>
      </select>
      <Aviso estado={estado} />
      <BotonEnviar className="btn-primario w-full">Crear usuario</BotonEnviar>
    </form>
  );
}
