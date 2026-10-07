import Link from "next/link";
import { db } from "@/lib/db";
import { filtroGarantias, type UsuarioSesion } from "@/lib/auth";
import { GRUPOS, ESTADOS, numeroGarantia, type Estado } from "@/lib/constantes";
import { incluirVista, tieneNovedad } from "@/lib/novedades";
import { fechaHora } from "@/lib/formato";
import { TarjetaGarantia, diasDesde } from "@/components/TarjetaGarantia";
import { EstadoBadge } from "@/components/EstadoBadge";

export async function InicioDistribuidor({ usuario }: { usuario: UsuarioSesion }) {
  const filtro = filtroGarantias(usuario);
  const verTodas = !usuario.sucursalId;

  const [abiertas, porEstado, sucursales, porSucursal, eventos] = await Promise.all([
    db.garantia.findMany({
      where: { ...filtro, estado: { notIn: ["FINALIZADA", "RECHAZADA"] } },
      include: { producto: true, sucursal: true, ...incluirVista(usuario.id), eventos: { orderBy: { creadoEn: "desc" }, take: 1 } },
      orderBy: { actualizadoEn: "desc" },
    }),
    db.garantia.groupBy({ by: ["estado"], where: filtro, _count: true }),
    verTodas ? db.sucursal.findMany({ where: { distribuidorId: usuario.distribuidorId!, activa: true }, orderBy: { nombre: "asc" } }) : Promise.resolve([]),
    verTodas ? db.garantia.groupBy({ by: ["sucursalId", "estado"], where: filtro, _count: true }) : Promise.resolve([]),
    db.evento.findMany({
      where: { garantia: filtro, usuario: { distribuidorId: null } },
      include: { usuario: true, garantia: { include: { producto: true } } },
      orderBy: { creadoEn: "desc" },
      take: 6,
    }),
  ]);

  const conteo = Object.fromEntries(porEstado.map((e) => [e.estado, e._count])) as Partial<Record<Estado, number>>;
  const suma = (estados: readonly Estado[]) => estados.reduce((s, e) => s + (conteo[e] ?? 0), 0);

  const tarjeta = (g: (typeof abiertas)[number]) => ({
    id: g.id,
    estado: g.estado,
    producto: g.producto.nombre,
    tipoFalla: g.tipoFalla,
    cliente: g.clienteNombre,
    ubicacion: verTodas ? g.sucursal.nombre : undefined,
    dias: diasDesde(g.eventos[0]?.creadoEn ?? g.creadoEn),
    novedad: tieneNovedad(usuario, g),
  });

  const atencion = abiertas.filter((g) => g.estado === "INFO_REQUERIDA" || tieneNovedad(usuario, g));
  const enCurso = abiertas.filter((g) => !atencion.includes(g));

  const resumen = [
    { label: "En curso", valor: suma(GRUPOS.EN_CURSO.estados), href: "/garantias?grupo=EN_CURSO" },
    { label: "Falta información", valor: conteo.INFO_REQUERIDA ?? 0, href: "/garantias?grupo=ATENCION", resaltar: (conteo.INFO_REQUERIDA ?? 0) > 0 },
    { label: "Finalizadas", valor: conteo.FINALIZADA ?? 0, href: "/garantias?grupo=FINALIZADAS" },
    { label: "Rechazadas", valor: conteo.RECHAZADA ?? 0, href: "/garantias?grupo=RECHAZADAS" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="titulo-seccion">{usuario.distribuidor?.razonSocial} · {usuario.sucursal?.nombre ?? "Todas las sucursales"}</p>
          <h1 className="mt-1 text-3xl font-black">Hola, {usuario.nombre.split(" ")[0]} 👋</h1>
        </div>
        <Link href="/garantias/nueva" className="btn-marca px-6 py-3 text-base">+ Cargar nueva garantía</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumen.map((r) => (
          <Link
            key={r.label}
            href={r.href}
            className={`tarjeta p-5 transition hover:border-tinta ${r.resaltar ? "border-purple-300 bg-purple-50" : ""}`}
          >
            <div className="text-4xl font-black">{r.valor}</div>
            <div className="mt-1 text-sm font-medium text-zinc-600">{r.label} →</div>
          </Link>
        ))}
      </div>

      {atencion.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Necesitan tu atención</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {atencion.map((g) => (
              <TarjetaGarantia key={g.id} g={tarjeta(g)} mostrarEstado />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Garantías en curso</h2>
        {enCurso.length === 0 && atencion.length === 0 ? (
          <div className="tarjeta p-10 text-center">
            <p className="text-zinc-500">No tenés garantías en curso.</p>
            <Link href="/garantias/nueva" className="btn-primario mt-4">Cargar la primera</Link>
          </div>
        ) : enCurso.length === 0 ? (
          <p className="text-sm text-zinc-500">Todas las garantías en curso están arriba.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {enCurso.map((g) => (
              <TarjetaGarantia key={g.id} g={tarjeta(g)} mostrarEstado />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {verTodas && sucursales.length > 1 && (
          <section className="tarjeta overflow-hidden">
            <h2 className="border-b border-zinc-100 px-5 py-4 font-bold">Por sucursal</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Sucursal</th>
                  <th className="px-3 py-2 text-right font-medium">En curso</th>
                  <th className="px-3 py-2 text-right font-medium">Finalizadas</th>
                  <th className="px-5 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {sucursales.map((s) => {
                  const filas = porSucursal.filter((p) => p.sucursalId === s.id);
                  const cuenta = (estados: readonly string[]) =>
                    filas.filter((f) => estados.includes(f.estado)).reduce((a, f) => a + f._count, 0);
                  return (
                    <tr key={s.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <Link href={`/garantias?sucursal=${s.id}`} className="font-semibold hover:underline">{s.nombre}</Link>
                      </td>
                      <td className="px-3 py-3 text-right">{cuenta(GRUPOS.EN_CURSO.estados)}</td>
                      <td className="px-3 py-3 text-right">{cuenta(["FINALIZADA"])}</td>
                      <td className="px-5 py-3 text-right font-bold">{filas.reduce((a, f) => a + f._count, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        <section className="tarjeta overflow-hidden">
          <h2 className="border-b border-zinc-100 px-5 py-4 font-bold">Últimas respuestas de Driven</h2>
          {eventos.length === 0 && <p className="p-5 text-sm text-zinc-500">Todavía no hay movimientos.</p>}
          <ul className="divide-y divide-zinc-100">
            {eventos.map((e) => (
              <li key={e.id}>
                <Link href={`/garantias/${e.garantiaId}`} className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-zinc-50">
                  <div className="min-w-0 text-sm">
                    <span className="font-semibold">{numeroGarantia(e.garantiaId)}</span> · {e.garantia.producto.nombre}
                    <div className="truncate text-xs text-zinc-500">
                      {e.comentario ?? `Pasó a "${ESTADOS[e.estadoNuevo as Estado]?.label}"`}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <EstadoBadge estado={e.estadoNuevo} />
                    <div className="mt-1 text-[11px] text-zinc-400">{fechaHora(e.creadoEn)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
