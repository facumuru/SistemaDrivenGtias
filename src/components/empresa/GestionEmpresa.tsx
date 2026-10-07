import { db } from "@/lib/db";
import { ROLES, type Rol } from "@/lib/constantes";
import { alternarSucursal, alternarUsuario } from "@/app/(app)/administracion/acciones";
import { FormSucursal } from "./FormSucursal";
import { FormUsuarioEmpresa } from "./FormUsuarioEmpresa";

export async function GestionEmpresa({ distribuidorId, usuarioActualId }: { distribuidorId: string; usuarioActualId: string }) {
  const [sucursales, usuarios] = await Promise.all([
    db.sucursal.findMany({
      where: { distribuidorId },
      include: { _count: { select: { garantias: true, usuarios: true } } },
      orderBy: { nombre: "asc" },
    }),
    db.usuario.findMany({ where: { distribuidorId }, include: { sucursal: true }, orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Sucursales</h2>
          <p className="text-sm text-zinc-500">Cada sucursal ve y carga solo sus propias garantías. La gerencia ve todas.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {sucursales.map((s) => (
              <div key={s.id} className={`tarjeta p-5 ${s.activa ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">🏬 {s.nombre}</div>
                    <div className="text-xs text-zinc-500">{[s.direccion, s.localidad, s.provincia].filter(Boolean).join(", ") || "Sin dirección"}</div>
                  </div>
                  <form action={alternarSucursal}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.activa ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {s.activa ? "Activa" : "Inactiva"}
                    </button>
                  </form>
                </div>
                <div className="mt-4 flex gap-6 text-sm">
                  <div><b className="text-xl">{s._count.garantias}</b> <span className="text-zinc-500">garantías</span></div>
                  <div><b className="text-xl">{s._count.usuarios}</b> <span className="text-zinc-500">usuarios</span></div>
                </div>
              </div>
            ))}
          </div>
          <FormSucursal distribuidorId={distribuidorId} />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Usuarios</h2>
          <p className="text-sm text-zinc-500">Asigná cada persona a su sucursal, o a &quot;Todas&quot; si tiene que ver toda la empresa.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="tarjeta divide-y divide-zinc-100 overflow-hidden">
            {usuarios.length === 0 && <p className="p-6 text-sm text-zinc-500">Todavía no hay usuarios.</p>}
            {usuarios.map((u) => (
              <div key={u.id} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${u.activo ? "" : "opacity-50"}`}>
                <div className="min-w-0">
                  <div className="font-semibold">{u.nombre}</div>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium">{u.sucursal?.nombre ?? "Todas las sucursales"}</span>
                  <span className="text-xs text-zinc-500">{ROLES[u.rol as Rol]}</span>
                  {u.id === usuarioActualId ? (
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
          <FormUsuarioEmpresa
            distribuidorId={distribuidorId}
            sucursales={sucursales.filter((s) => s.activa).map((s) => ({ id: s.id, nombre: s.nombre }))}
          />
        </div>
      </section>
    </div>
  );
}
