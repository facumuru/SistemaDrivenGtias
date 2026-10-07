import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requerirUsuario } from "@/lib/auth";
import { ROLES, type Rol } from "@/lib/constantes";
import { fecha } from "@/lib/formato";
import { Encabezado } from "@/components/Encabezado";
import { alternarUsuario } from "../acciones";
import { FormUsuario } from "./FormUsuario";

export default async function UsuariosPage() {
  const actual = await requerirUsuario();
  const esAdminDriven = actual.rol === "DRIVEN_ADMIN";
  if (!esAdminDriven && actual.rol !== "DIST_ADMIN") redirect("/panel");

  const [usuarios, distribuidores] = await Promise.all([
    db.usuario.findMany({
      where: esAdminDriven ? {} : { distribuidorId: actual.distribuidorId },
      include: { distribuidor: true },
      orderBy: [{ distribuidorId: "asc" }, { nombre: "asc" }],
    }),
    esAdminDriven
      ? db.distribuidor.findMany({ where: { activo: true }, orderBy: { razonSocial: "asc" }, select: { id: true, razonSocial: true } })
      : Promise.resolve([]),
  ]);

  return (
    <>
      <Encabezado
        titulo={esAdminDriven ? "Usuarios" : "Mi equipo"}
        subtitulo={esAdminDriven ? "Usuarios de Driven y de todos los distribuidores" : "Personas de tu empresa con acceso al portal"}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="tarjeta overflow-x-auto xl:col-span-2">
          <table className="tabla w-full">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                {esAdminDriven && <th>Empresa</th>}
                <th>Alta</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="font-semibold">{u.nombre}</div>
                    <div className="text-xs text-zinc-500">{u.email}</div>
                  </td>
                  <td className="text-xs">{ROLES[u.rol as Rol]}</td>
                  {esAdminDriven && <td>{u.distribuidor?.razonSocial ?? "Driven"}</td>}
                  <td className="text-xs">{fecha(u.creadoEn)}</td>
                  <td>
                    {u.id === actual.id ? (
                      <span className="text-xs text-zinc-400">Vos</span>
                    ) : (
                      <form action={alternarUsuario}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className={`text-xs font-semibold ${u.activo ? "text-emerald-700" : "text-red-600"} hover:underline`}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormUsuario esAdminDriven={esAdminDriven} distribuidores={distribuidores} />
      </div>
    </>
  );
}
