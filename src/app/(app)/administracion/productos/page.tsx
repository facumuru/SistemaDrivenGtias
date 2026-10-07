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

  return (
    <>
      <Encabezado titulo="Productos" subtitulo="Catálogo disponible para cargar garantías" />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="tarjeta overflow-x-auto xl:col-span-2">
          <table className="tabla w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Garantía</th>
                <th>Reclamos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.codigo}</td>
                  <td className="font-medium">{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td>{p.garantiaMeses} meses</td>
                  <td>{p._count.garantias}</td>
                  <td>
                    <form action={alternarProducto}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`text-xs font-semibold ${p.activo ? "text-emerald-700" : "text-red-600"} hover:underline`}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormProducto />
      </div>
    </>
  );
}
