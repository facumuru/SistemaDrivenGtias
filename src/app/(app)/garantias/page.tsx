import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { filtroGarantias, requerirUsuario } from "@/lib/auth";
import { GRUPOS, PENDIENTES_DIST, PENDIENTES_DRIVEN, RESOLUCIONES, TIPOS_FALLA, esDriven, numeroGarantia } from "@/lib/constantes";
import { incluirVista, tieneNovedad } from "@/lib/novedades";
import { fecha } from "@/lib/formato";
import { EstadoBadge, PuntoNovedad } from "@/components/EstadoBadge";
import { diasDesde, textoDias } from "@/components/TarjetaGarantia";

type Busqueda = { grupo?: string; q?: string; distribuidor?: string; sucursal?: string };

export default async function GarantiasPage({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const usuario = await requerirUsuario();
  const driven = esDriven(usuario.rol);
  const verSucursales = driven || !usuario.sucursalId;
  const { grupo = "", q = "", distribuidor = "", sucursal = "" } = await searchParams;

  const base: Prisma.GarantiaWhereInput = { ...filtroGarantias(usuario) };
  if (driven && distribuidor) base.distribuidorId = distribuidor;
  if (verSucursales && sucursal) base.sucursalId = sucursal;
  if (q) {
    const num = Number(q.replace(/\D/g, ""));
    base.OR = [
      { clienteNombre: { contains: q } },
      { numeroSerie: { contains: q } },
      { numeroFactura: { contains: q } },
      { producto: { nombre: { contains: q } } },
      { producto: { codigo: { contains: q.toUpperCase() } } },
      ...(num ? [{ id: num }] : []),
    ];
  }

  const pendientes = driven ? PENDIENTES_DRIVEN : PENDIENTES_DIST;
  const pestañas = [
    { id: "", label: "Todas", where: {} },
    { id: "ATENCION", label: driven ? "Pendientes de Driven" : "Falta información", where: { estado: { in: pendientes } } },
    ...Object.entries(GRUPOS).map(([id, g]) => ({ id, label: g.label, where: { estado: { in: [...g.estados] } } })),
  ];
  const actual = pestañas.find((p) => p.id === grupo) ?? pestañas[0];

  const [garantias, conteos, sucursales, distribuidores] = await Promise.all([
    db.garantia.findMany({
      where: { ...base, ...actual.where },
      include: {
        producto: true,
        distribuidor: true,
        sucursal: true,
        ...incluirVista(usuario.id),
        eventos: { orderBy: { creadoEn: "desc" }, take: 1 },
      },
      orderBy: { actualizadoEn: "desc" },
      take: 300,
    }),
    Promise.all(pestañas.map((p) => db.garantia.count({ where: { ...base, ...p.where } }))),
    verSucursales
      ? db.sucursal.findMany({
          where: driven ? (distribuidor ? { distribuidorId: distribuidor } : {}) : { distribuidorId: usuario.distribuidorId! },
          include: { distribuidor: true },
          orderBy: [{ distribuidor: { razonSocial: "asc" } }, { nombre: "asc" }],
        })
      : Promise.resolve([]),
    driven ? db.distribuidor.findMany({ orderBy: { razonSocial: "asc" } }) : Promise.resolve([]),
  ]);

  const params = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(distribuidor && { distribuidor }), ...(sucursal && { sucursal }), ...extra });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return s ? `/garantias?${s}` : "/garantias";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{driven ? "Todas las garantías" : "Mis garantías"}</h1>
          {!driven && usuario.sucursal && <p className="mt-1 text-sm text-zinc-500">Sucursal {usuario.sucursal.nombre}</p>}
        </div>
        {!driven && <Link href="/garantias/nueva" className="btn-marca">+ Nueva garantía</Link>}
      </div>

      <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-zinc-200">
        {pestañas.map((p, i) => (
          <Link
            key={p.id}
            href={params({ grupo: p.id })}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap ${
              p.id === actual.id ? "border-tinta text-tinta" : "border-transparent text-zinc-500 hover:text-tinta"
            }`}
          >
            {p.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${p.id === actual.id ? "bg-tinta text-white" : "bg-zinc-200"}`}>{conteos[i]}</span>
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="grupo" value={actual.id} />
        <input name="q" defaultValue={q} placeholder="Buscar por n°, cliente, serie, factura o producto" className="campo max-w-md flex-1" />
        {driven && (
          <select name="distribuidor" defaultValue={distribuidor} className="campo w-auto">
            <option value="">Todos los distribuidores</option>
            {distribuidores.map((d) => (
              <option key={d.id} value={d.id}>{d.razonSocial}</option>
            ))}
          </select>
        )}
        {verSucursales && sucursales.length > 1 && (
          <select name="sucursal" defaultValue={sucursal} className="campo w-auto">
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{driven && !distribuidor ? `${s.distribuidor.razonSocial} · ${s.nombre}` : s.nombre}</option>
            ))}
          </select>
        )}
        <button className="btn-primario">Filtrar</button>
        {(q || distribuidor || sucursal) && <Link href={params({ q: "", distribuidor: "", sucursal: "", grupo: actual.id })} className="btn-secundario">Limpiar filtros</Link>}
      </form>

      <div className="tarjeta divide-y divide-zinc-100 overflow-hidden">
        {garantias.length === 0 && <p className="p-12 text-center text-zinc-500">No hay garantías para mostrar.</p>}
        {garantias.map((g) => {
          const novedad = tieneNovedad(usuario, g);
          return (
            <Link
              key={g.id}
              href={`/garantias/${g.id}`}
              className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 transition hover:bg-zinc-50 md:grid-cols-[110px_1fr_220px_150px_110px] ${novedad ? "bg-marca-claro/60" : ""}`}
            >
              <div className="text-sm font-bold text-zinc-500 tabular-nums">{numeroGarantia(g.id)}</div>
              <div className="col-span-2 min-w-0 md:col-span-1">
                <div className="truncate font-semibold">{g.producto.nombre}</div>
                <div className="truncate text-xs text-zinc-500">
                  {TIPOS_FALLA[g.tipoFalla as keyof typeof TIPOS_FALLA]} · {g.clienteNombre}
                  {g.numeroSerie && ` · S/N ${g.numeroSerie}`}
                </div>
              </div>
              <div className="min-w-0 text-xs text-zinc-600">
                {driven && <div className="truncate font-semibold">{g.distribuidor.razonSocial}</div>}
                {verSucursales && <div className="truncate">Sucursal {g.sucursal.nombre}</div>}
                <div className="text-zinc-400">Compra {fecha(g.fechaCompra)}</div>
              </div>
              <div className="flex flex-col items-start gap-1">
                <EstadoBadge estado={g.estado} />
                {g.resolucion && (
                  <span className="text-[11px] text-zinc-500">{RESOLUCIONES[g.resolucion as keyof typeof RESOLUCIONES]?.label}</span>
                )}
              </div>
              <div className="text-right text-xs text-zinc-400">
                {novedad ? <PuntoNovedad /> : textoDias(diasDesde(g.eventos[0]?.creadoEn ?? g.creadoEn))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
