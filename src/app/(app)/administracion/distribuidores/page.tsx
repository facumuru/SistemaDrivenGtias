import { db } from "@/lib/db";
import { requerirDrivenAdmin } from "@/lib/auth";
import { Encabezado } from "@/components/Encabezado";
import { alternarDistribuidor } from "../acciones";
import { FormDistribuidor } from "./FormDistribuidor";

export default async function DistribuidoresPage() {
  await requerirDrivenAdmin();
  const distribuidores = await db.distribuidor.findMany({
    orderBy: { razonSocial: "asc" },
    include: { _count: { select: { usuarios: true, garantias: true } } },
  });

  return (
    <>
      <Encabezado titulo="Distribuidores" subtitulo="Empresas habilitadas para cargar garantías Driven" />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="tarjeta overflow-x-auto xl:col-span-2">
          <table className="tabla w-full">
            <thead>
              <tr>
                <th>Razón social</th>
                <th>CUIT</th>
                <th>Ubicación</th>
                <th>Usuarios</th>
                <th>Garantías</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {distribuidores.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="font-semibold">{d.razonSocial}</div>
                    <div className="text-xs text-zinc-500">{[d.email, d.telefono].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td>{d.cuit}</td>
                  <td>{[d.localidad, d.provincia].filter(Boolean).join(", ") || "—"}</td>
                  <td>{d._count.usuarios}</td>
                  <td>{d._count.garantias}</td>
                  <td>
                    <form action={alternarDistribuidor}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className={`text-xs font-semibold ${d.activo ? "text-emerald-700" : "text-red-600"} hover:underline`}>
                        {d.activo ? "Activo" : "Inactivo"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormDistribuidor />
      </div>
    </>
  );
}
