import { db } from "@/lib/db";
import { requerirDrivenAdmin } from "@/lib/auth";
import { Encabezado } from "@/components/Encabezado";
import { alternarProducto } from "../acciones";
import { FormProducto } from "./FormProducto";

export default async function ProductosPage() {
  await requerirDrivenAdmin();
  const productos = await db.producto.findMany({
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    include: { _count: { select: { garantias: true } } },
  });
  const categorias = [...new Set(productos.map((p) => p.categoria))];

  return (
    <>
      <Encabezado titulo="Productos" subtitulo="Catálogo que ven los distribuidores al cargar una garantía" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {categorias.map((cat) => (
            <section key={cat}>
              <h2 className="titulo-seccion mb-2">{cat}</h2>
              <div className="tarjeta divide-y divide-zinc-100 overflow-hidden">
                {productos
                  .filter((p) => p.categoria === cat)
                  .map((p) => (
                    <div key={p.id} className={`flex items-center justify-between gap-3 px-5 py-3 ${p.activo ? "" : "opacity-50"}`}>
                      <div className="min-w-0">
                        <div className="font-semibold">{p.nombre}</div>
                        <div className="font-mono text-xs text-zinc-500">{p.codigo} · {p.garantiaMeses} meses</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500">{p._count.garantias} reclamos</span>
                        <form action={alternarProducto}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className={`w-16 cursor-pointer text-right text-xs font-semibold hover:underline ${p.activo ? "text-emerald-700" : "text-red-600"}`}>
                            {p.activo ? "Activo" : "Inactivo"}
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
        <FormProducto />
      </div>
    </>
  );
}
