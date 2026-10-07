import { db } from "@/lib/db";
import { requerirDrivenAdmin } from "@/lib/auth";
import { ROLES, type Rol } from "@/lib/constantes";
import { Encabezado } from "@/components/Encabezado";
import { alternarUsuario } from "../acciones";
import { FormUsuario } from "./FormUsuario";

export default async function EquipoDrivenPage() {
  const actual = await requerirDrivenAdmin();
  const usuarios = await db.usuario.findMany({ where: { distribuidorId: null }, orderBy: { nombre: "asc" } });

  return (
    <>
      <Encabezado
        titulo="Equipo Driven"
        subtitulo="Personas de Driven con acceso al portal. Los usuarios de cada distribuidor se gestionan desde su ficha."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="tarjeta divide-y divide-zinc-100 overflow-hidden">
          {usuarios.map((u) => (
            <div key={u.id} className={`flex items-center justify-between gap-3 px-5 py-3.5 ${u.activo ? "" : "opacity-50"}`}>
              <div>
                <div className="font-semibold">{u.nombre}</div>
                <div className="text-xs text-zinc-500">{u.email}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-500">{ROLES[u.rol as Rol]}</span>
                {u.id === actual.id ? (
                  <span className="w-16 text-right text-xs text-zinc-400">Vos</span>
                ) : (
                  <form action={alternarUsuario}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className={`w-16 cursor-pointer text-right text-xs font-semibold hover:underline ${u.activo ? "text-emerald-700" : "text-red-600"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
        <FormUsuario />
      </div>
    </>
  );
}
