"use client";

import { useActionState } from "react";
import { crearUsuario } from "@/app/(app)/administracion/acciones";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

export function FormUsuarioEmpresa({
  distribuidorId,
  sucursales,
}: {
  distribuidorId: string;
  sucursales: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState(crearUsuario, undefined);
  return (
    <form action={accion} className="tarjeta h-fit space-y-3 p-5">
      <h3 className="font-bold">+ Agregar usuario</h3>
      <input type="hidden" name="distribuidorId" value={distribuidorId} />
      <input name="nombre" placeholder="Nombre y apellido *" required className="campo" />
      <input name="email" type="email" placeholder="Email *" required className="campo" />
      <input name="password" type="text" placeholder="Contraseña inicial * (mín. 8)" required minLength={8} className="campo" />
      <div>
        <label className="etiqueta">Sucursal</label>
        <select name="sucursalId" className="campo" defaultValue={sucursales.length === 1 ? sucursales[0].id : ""}>
          <option value="">Todas las sucursales (gerencia)</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="etiqueta">Permisos</label>
        <select name="rol" className="campo" defaultValue="DIST_OPERADOR">
          <option value="DIST_OPERADOR">Operador: carga y sigue garantías</option>
          <option value="DIST_ADMIN">Administrador: además gestiona usuarios</option>
        </select>
      </div>
      <Aviso estado={estado} />
      <BotonEnviar className="btn-primario w-full">Crear usuario</BotonEnviar>
    </form>
  );
}
