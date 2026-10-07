"use client";

import { useActionState } from "react";
import { crearProducto } from "../acciones";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

export function FormProducto() {
  const [estado, accion] = useActionState(crearProducto, undefined);
  return (
    <form action={accion} className="tarjeta h-fit space-y-3 p-5">
      <h2 className="font-semibold">Nuevo producto</h2>
      <input name="codigo" placeholder="Código / SKU *" required className="campo" />
      <input name="nombre" placeholder="Nombre *" required className="campo" />
      <input name="categoria" placeholder="Categoría * (ej: Compresores)" required className="campo" list="categorias" />
      <datalist id="categorias">
        <option value="Compresores" />
        <option value="4x4 y rescate" />
        <option value="Aire libre" />
        <option value="Térmicos y calentadores" />
      </datalist>
      <div>
        <label className="etiqueta">Meses de garantía</label>
        <input name="garantiaMeses" type="number" min={1} defaultValue={24} className="campo" />
      </div>
      <Aviso estado={estado} />
      <BotonEnviar className="btn-primario w-full">Crear producto</BotonEnviar>
    </form>
  );
}
