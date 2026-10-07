import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { filtroGarantias, requerirUsuario } from "@/lib/auth";
import { ESTADOS, ESTADOS_ABIERTOS, RESOLUCIONES, esDriven, numeroGarantia } from "@/lib/constantes";
import { fecha, fechaHora } from "@/lib/formato";
import { Encabezado } from "@/components/Encabezado";
import { EstadoBadge } from "@/components/EstadoBadge";

type Busqueda = { estado?: string; q?: string; distribuidor?: string };

export default async function GarantiasPage({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const usuario = await requerirUsuario();
  const driven = esDriven(usuario.rol);
  const { estado = "", q = "", distribuidor = "" } = await searchParams;

  const where: Prisma.GarantiaWhereInput = { ...filtroGarantias(usuario) };
  if (estado === "ABIERTAS") where.estado = { in: ESTADOS_ABIERTOS };
  else if (estado in ESTADOS) where.estado = estado;
  if (driven && distribuidor) where.distribuidorId = distribuidor;
  if (q) {
    const num = Number(q.replace(/\D/g, ""));
    where.OR = [
      { clienteNombre: { contains: q } },
      { numeroSerie: { contains: q } },
      { numeroFactura: { contains: q } },
      { producto: { nombre: { contains: q } } },
      { producto: { codigo: { contains: q.toUpperCase() } } },
      ...(num ? [{ id: num }] : []),
    ];
  }

  const [garantias, distribuidores] = await Promise.all([
    db.garantia.findMany({
      where,
      include: { producto: true, distribuidor: true, _count: { select: { mensajes: true } } },
      orderBy: { actualizadoEn: "desc" },
      take: 200,
    }),
    driven ? db.distribuidor.findMany({ orderBy: { razonSocial: "asc" } }) : Promise.resolve([]),
  ]);

  return (
    <>
      <Encabezado
        titulo={driven ? "Garantías" : "Mis garantías"}
        subtitulo={`${garantias.length} resultado${garantias.length === 1 ? "" : "s"}`}
      >
        {!driven && <Link href="/garantias/nueva" className="btn-primario">+ Cargar garantía</Link>}
      </Encabezado>

      <form className="tarjeta mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-48 flex-1">
          <label className="etiqueta">Buscar</label>
          <input name="q" defaultValue={q} placeholder="N° garantía, cliente, serie, factura, producto..." className="campo" />
        </div>
        <div>
          <label className="etiqueta">Estado</label>
          <select name="estado" defaultValue={estado} className="campo">
            <option value="">Todos</option>
            <option value="ABIERTAS">Abiertas</option>
            {Object.entries(ESTADOS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        {driven && (
          <div>
            <label className="etiqueta">Distribuidor</label>
            <select name="distribuidor" defaultValue={distribuidor} className="campo">
              <option value="">Todos</option>
              {distribuidores.map((d) => (
                <option key={d.id} value={d.id}>{d.razonSocial}</option>
              ))}
            </select>
          </div>
        )}
        <button className="btn-oscuro">Filtrar</button>
        {(q || estado || distribuidor) && <Link href="/garantias" className="btn-secundario">Limpiar</Link>}
      </form>

      <div className="tarjeta overflow-x-auto">
        <table className="tabla w-full">
          <thead>
            <tr>
              <th>N°</th>
              <th>Producto</th>
              {driven && <th>Distribuidor</th>}
              <th>Cliente</th>
              <th>Compra</th>
              <th>Estado</th>
              <th>Resolución</th>
              <th>Actualizada</th>
            </tr>
          </thead>
          <tbody>
            {garantias.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-500">No se encontraron garantías.</td>
              </tr>
            )}
            {garantias.map((g) => (
              <tr key={g.id} className="hover:bg-orange-50/40">
                <td className="font-semibold">
                  <Link href={`/garantias/${g.id}`} className="text-marca-oscuro hover:underline">
                    {numeroGarantia(g.id)}
                  </Link>
                </td>
                <td>
                  <div className="font-medium">{g.producto.nombre}</div>
                  <div className="text-xs text-zinc-500">
                    {g.producto.codigo}
                    {g.numeroSerie && ` · S/N ${g.numeroSerie}`}
                  </div>
                </td>
                {driven && <td>{g.distribuidor.razonSocial}</td>}
                <td>{g.clienteNombre}</td>
                <td>{fecha(g.fechaCompra)}</td>
                <td><EstadoBadge estado={g.estado} /></td>
                <td className="text-xs">{g.resolucion ? RESOLUCIONES[g.resolucion as keyof typeof RESOLUCIONES] : "—"}</td>
                <td className="text-xs text-zinc-500">
                  {fechaHora(g.actualizadoEn)}
                  {g._count.mensajes > 0 && <div>💬 {g._count.mensajes}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
