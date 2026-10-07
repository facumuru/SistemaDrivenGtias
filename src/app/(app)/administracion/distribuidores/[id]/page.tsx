import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requerirDrivenAdmin } from "@/lib/auth";
import { GestionEmpresa } from "@/components/empresa/GestionEmpresa";
import { alternarDistribuidor } from "../../acciones";

export default async function FichaDistribuidorPage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requerirDrivenAdmin();
  const d = await db.distribuidor.findUnique({ where: { id: (await params).id } });
  if (!d) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/administracion/distribuidores" className="text-sm text-zinc-500 hover:text-tinta">← Distribuidores</Link>
          <h1 className="mt-1 text-3xl font-black">{d.razonSocial}</h1>
          <p className="text-sm text-zinc-500">
            CUIT {d.cuit}
            {d.email && ` · ${d.email}`}
            {d.telefono && ` · ${d.telefono}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/garantias?distribuidor=${d.id}`} className="btn-secundario">Ver sus garantías</Link>
          <form action={alternarDistribuidor}>
            <input type="hidden" name="id" value={d.id} />
            <button className={d.activo ? "btn-peligro" : "btn-primario"}>{d.activo ? "Deshabilitar" : "Habilitar"}</button>
          </form>
        </div>
      </div>
      <GestionEmpresa distribuidorId={d.id} usuarioActualId={usuario.id} />
    </div>
  );
}
