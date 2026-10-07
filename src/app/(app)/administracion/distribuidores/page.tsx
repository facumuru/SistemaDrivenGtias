import Link from "next/link";
import { db } from "@/lib/db";
import { requerirDrivenAdmin } from "@/lib/auth";
import { Encabezado } from "@/components/Encabezado";
import { FormDistribuidor } from "./FormDistribuidor";

export default async function DistribuidoresPage() {
  await requerirDrivenAdmin();
  const distribuidores = await db.distribuidor.findMany({
    orderBy: { razonSocial: "asc" },
    include: {
      sucursales: { where: { activa: true }, select: { nombre: true }, orderBy: { nombre: "asc" } },
      _count: { select: { usuarios: true, garantias: true } },
    },
  });

  return (
    <>
      <Encabezado titulo="Distribuidores" subtitulo="Empresas habilitadas para cargar garantías. Hacé clic para ver sus sucursales y usuarios." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {distribuidores.map((d) => (
            <Link
              key={d.id}
              href={`/administracion/distribuidores/${d.id}`}
              className={`tarjeta p-5 transition hover:border-tinta ${d.activo ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-lg font-bold">{d.razonSocial}</div>
                {!d.activo && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">Inactivo</span>}
              </div>
              <div className="text-xs text-zinc-500">CUIT {d.cuit}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.sucursales.map((s) => (
                  <span key={s.nombre} className="rounded-full bg-marca-claro px-2.5 py-0.5 text-xs font-medium text-marca-oscuro">{s.nombre}</span>
                ))}
              </div>
              <div className="mt-4 flex gap-6 text-sm text-zinc-500">
                <span><b className="text-tinta">{d._count.garantias}</b> garantías</span>
                <span><b className="text-tinta">{d._count.usuarios}</b> usuarios</span>
              </div>
            </Link>
          ))}
        </div>
        <FormDistribuidor />
      </div>
    </>
  );
}
