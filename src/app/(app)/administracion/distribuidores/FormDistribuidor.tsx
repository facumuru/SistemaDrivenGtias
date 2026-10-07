"use client";

import { useActionState } from "react";
import { crearDistribuidor } from "../acciones";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

export function FormDistribuidor() {
  const [estado, accion] = useActionState(crearDistribuidor, undefined);
  return (
    <form action={accion} className="tarjeta h-fit space-y-3 p-5">
      <h2 className="font-bold">+ Nuevo distribuidor</h2>
      <input name="razonSocial" placeholder="Razón social *" required className="campo" />
      <input name="cuit" placeholder="CUIT * (11 dígitos)" required className="campo" />
      <input name="email" type="email" placeholder="Email de contacto" className="campo" />
      <input name="telefono" placeholder="Teléfono" className="campo" />
      <div className="rounded-xl bg-zinc-50 p-3">
        <label className="etiqueta">Primera sucursal</label>
        <input name="sucursal" placeholder="Casa central" className="campo" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input name="localidad" placeholder="Localidad" className="campo" />
          <input name="provincia" placeholder="Provincia" className="campo" />
        </div>
        <p className="mt-2 text-xs text-zinc-500">Después vas a poder agregar más sucursales y usuarios.</p>
      </div>
      <Aviso estado={estado} />
      <BotonEnviar className="btn-primario w-full">Crear distribuidor</BotonEnviar>
    </form>
  );
}
