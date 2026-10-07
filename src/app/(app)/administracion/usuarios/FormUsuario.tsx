"use client";

import { useActionState, useState } from "react";
import { crearUsuario } from "../acciones";
import { ROLES } from "@/lib/constantes";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

export function FormUsuario({
  esAdminDriven,
  distribuidores,
}: {
  esAdminDriven: boolean;
  distribuidores: { id: string; razonSocial: string }[];
}) {
  const [estado, accion] = useActionState(crearUsuario, undefined);
  const [rol, setRol] = useState(esAdminDriven ? "DIST_ADMIN" : "DIST_OPERADOR");
  const roles = Object.entries(ROLES).filter(([k]) => esAdminDriven || k.startsWith("DIST_"));

  return (
    <form action={accion} className="tarjeta h-fit space-y-3 p-5">
      <h2 className="font-semibold">Nuevo usuario</h2>
      <input name="nombre" placeholder="Nombre y apellido *" required className="campo" />
      <input name="email" type="email" placeholder="Email *" required className="campo" />
      <input name="password" type="text" placeholder="Contraseña inicial * (mín. 8)" required minLength={8} className="campo" />
      <select name="rol" className="campo" value={rol} onChange={(e) => setRol(e.target.value)}>
        {roles.map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      {esAdminDriven && rol.startsWith("DIST_") && (
        <select name="distribuidorId" required className="campo" defaultValue="">
          <option value="" disabled>Distribuidor…</option>
          {distribuidores.map((d) => (
            <option key={d.id} value={d.id}>{d.razonSocial}</option>
          ))}
        </select>
      )}
      <Aviso estado={estado} />
      <BotonEnviar className="btn-primario w-full">Crear usuario</BotonEnviar>
    </form>
  );
}
