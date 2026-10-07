"use client";

import { useActionState } from "react";
import { crearDistribuidor } from "../acciones";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

export function FormDistribuidor() {
  const [estado, accion] = useActionState(crearDistribuidor, undefined);
  return (
    <form action={accion} className="tarjeta h-fit space-y-3 p-5">
      <h2 className="font-semibold">Nuevo distribuidor</h2>
      <input name="razonSocial" placeholder="Razón social *" required className="campo" />
      <input name="cuit" placeholder="CUIT * (sin guiones)" required className="campo" />
      <input name="email" type="email" placeholder="Email" className="campo" />
      <input name="telefono" placeholder="Teléfono" className="campo" />
      <input name="direccion" placeholder="Dirección" className="campo" />
      <div className="grid grid-cols-2 gap-2">
        <input name="localidad" placeholder="Localidad" className="campo" />
        <input name="provincia" placeholder="Provincia" className="campo" />
      </div>
      <Aviso estado={estado} />
      <BotonEnviar className="btn-primario w-full">Crear distribuidor</BotonEnviar>
    </form>
  );
}
