import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { filtroGarantias, usuarioActual } from "@/lib/auth";
import { TIPOS_FALLA, numeroGarantia } from "@/lib/constantes";
import { fecha } from "@/lib/formato";
import { Logo } from "@/components/Logo";
import { BotonImprimir } from "./BotonImprimir";

export default async function ImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const g = await db.garantia.findFirst({
    where: { id, ...filtroGarantias(usuario) },
    include: { producto: true, distribuidor: true, sucursal: true },
  });
  if (!g) notFound();

  const filas = [
    ["Distribuidor", `${g.distribuidor.razonSocial} · CUIT ${g.distribuidor.cuit}`],
    ["Sucursal", [g.sucursal.nombre, g.sucursal.direccion, g.sucursal.telefono].filter(Boolean).join(" · ")],
    ["Producto", `${g.producto.nombre} (${g.producto.codigo})`],
    ["N° de serie", g.numeroSerie ?? "—"],
    ["Compra", `${fecha(g.fechaCompra)}${g.numeroFactura ? ` · Factura ${g.numeroFactura}` : ""}`],
    ["Falla", `${TIPOS_FALLA[g.tipoFalla as keyof typeof TIPOS_FALLA]}: ${g.descripcionFalla}`],
    ["Cliente final", [g.clienteNombre, g.clienteTelefono].filter(Boolean).join(" · ")],
  ];

  return (
    <main className="mx-auto max-w-2xl bg-white p-10 print:p-0">
      <div className="no-imprimir mb-6 flex justify-end">
        <BotonImprimir />
      </div>
      <div className="rounded-2xl border-2 border-tinta p-8">
        <div className="flex items-start justify-between">
          <Logo alto={36} />
          <div className="text-right">
            <div className="text-xs font-bold tracking-[0.15em] text-zinc-500 uppercase">Garantía</div>
            <div className="text-4xl font-black tabular-nums">{numeroGarantia(g.id)}</div>
            <div className="text-xs text-zinc-500">Cargada el {fecha(g.creadoEn)}</div>
          </div>
        </div>
        <table className="mt-8 w-full text-sm">
          <tbody>
            {filas.map(([k, v]) => (
              <tr key={k} className="border-t border-zinc-200">
                <td className="w-36 py-2.5 pr-4 align-top font-semibold text-zinc-500">{k}</td>
                <td className="py-2.5">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 rounded-xl bg-zinc-100 p-4 text-center text-sm">
          Pegá esta hoja en la caja del equipo y enviala a Driven junto con todos los accesorios.
        </div>
      </div>
    </main>
  );
}
