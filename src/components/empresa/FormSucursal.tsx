"use client";

import { useActionState } from "react";
import { crearSucursal } from "@/app/(app)/administracion/acciones";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

export function FormSucursal({ distribuidorId }: { distribuidorId: string }) {
  const [estado, accion] = useActionState(crearSucursal, undefined);
  return (
    <form action={accion} className="tarjeta h-fit space-y-3 p-5">
      <h3 className="font-bold">+ Agregar sucursal</h3>
      <input type="hidden" name="distribuidorId" value={distribuidorId} />
      <input name="nombre" placeholder="Nombre * (ej: Mar del Plata)" required className="campo" />
      <input name="direccion" placeholder="Dirección" className="campo" />
      <div className="grid grid-cols-2 gap-2">
        <input name="localidad" placeholder="Localidad" className="campo" />
        <input name="provincia" placeholder="Provincia" className="campo" />
      </div>
      <input name="telefono" placeholder="Teléfono" className="campo" />
      <Aviso estado={estado} />
      <BotonEnviar className="btn-primario w-full">Crear sucursal</BotonEnviar>
    </form>
  );
}
