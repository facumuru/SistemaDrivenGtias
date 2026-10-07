import Link from "next/link";
import { db } from "@/lib/db";
import { filtroGarantias, requerirUsuario } from "@/lib/auth";
import { ESTADOS, TIPOS_FALLA, esDriven, numeroGarantia, type Estado } from "@/lib/constantes";
import { fechaHora } from "@/lib/formato";
import { Encabezado } from "@/components/Encabezado";
import { EstadoBadge } from "@/components/EstadoBadge";

export default async function PanelPage() {
  const usuario = await requerirUsuario();
  const driven = esDriven(usuario.rol);
  const filtro = filtroGarantias(usuario);

  const [porEstado, porFalla, porDistribuidor, atencion, eventos] = await Promise.all([
    db.garantia.groupBy({ by: ["estado"], where: filtro, _count: true }),
    db.garantia.groupBy({ by: ["tipoFalla"], where: filtro, _count: true, orderBy: { _count: { tipoFalla: "desc" } } }),
    driven
      ? db.garantia.groupBy({ by: ["distribuidorId"], _count: true, orderBy: { _count: { distribuidorId: "desc" } } })
      : Promise.resolve([]),
    db.garantia.findMany({
      where: { ...filtro, estado: { in: driven ? ["CARGADA", "EQUIPO_RECIBIDO", "EN_REVISION"] : ["INFO_REQUERIDA"] } },
      include: { producto: true, distribuidor: true },
      orderBy: { actualizadoEn: "asc" },
      take: 8,
    }),
    db.evento.findMany({
      where: { garantia: filtro },
      include: { usuario: true, garantia: { include: { producto: true } } },
      orderBy: { creadoEn: "desc" },
      take: 10,
    }),
  ]);

  const conteo = Object.fromEntries(porEstado.map((e) => [e.estado, e._count])) as Partial<Record<Estado, number>>;
  const total = porEstado.reduce((s, e) => s + e._count, 0);
  const distribuidores = driven
    ? await db.distribuidor.findMany({ where: { id: { in: porDistribuidor.map((d) => d.distribuidorId) } } })
    : [];
  const maxFalla = Math.max(1, ...porFalla.map((f) => f._count));

  const tarjetas = [
    { label: "Total", valor: total, estilo: "border-l-tinta" },
    { label: "Pendientes de revisión", valor: (conteo.CARGADA ?? 0) + (conteo.EQUIPO_RECIBIDO ?? 0) + (conteo.EN_REVISION ?? 0), estilo: "border-l-amber-500" },
    { label: "Esperando info", valor: conteo.INFO_REQUERIDA ?? 0, estilo: "border-l-purple-500" },
    { label: "Aprobadas", valor: (conteo.APROBADA ?? 0) + (conteo.FINALIZADA ?? 0), estilo: "border-l-emerald-500" },
    { label: "Rechazadas", valor: conteo.RECHAZADA ?? 0, estilo: "border-l-red-500" },
  ];

  return (
    <>
      <Encabezado
        titulo={`Hola, ${usuario.nombre.split(" ")[0]}`}
        subtitulo={driven ? "Resumen de garantías de toda la red de distribuidores" : `Resumen de ${usuario.distribuidor?.razonSocial}`}
      >
        {!driven && <Link href="/garantias/nueva" className="btn-primario">+ Cargar garantía</Link>}
      </Encabezado>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {tarjetas.map((t) => (
          <div key={t.label} className={`tarjeta border-l-4 p-4 ${t.estilo}`}>
            <div className="text-3xl font-black">{t.valor}</div>
            <div className="text-xs font-medium text-zinc-500">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="tarjeta xl:col-span-2">
          <h2 className="border-b border-zinc-100 px-5 py-3 font-semibold">
            {driven ? "Requieren acción de Driven" : "Driven te pidió información"}
          </h2>
          {atencion.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">No hay garantías pendientes. 👌</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {atencion.map((g) => (
                <li key={g.id}>
                  <Link href={`/garantias/${g.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">
                        {numeroGarantia(g.id)} · {g.producto.nombre}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        {driven && `${g.distribuidor.razonSocial} · `}
                        {TIPOS_FALLA[g.tipoFalla as keyof typeof TIPOS_FALLA]} · actualizada {fechaHora(g.actualizadoEn)}
                      </div>
                    </div>
                    <EstadoBadge estado={g.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tarjeta">
          <h2 className="border-b border-zinc-100 px-5 py-3 font-semibold">Fallas más frecuentes</h2>
          <div className="space-y-3 p-5">
            {porFalla.length === 0 && <p className="text-sm text-zinc-500">Sin datos todavía.</p>}
            {porFalla.map((f) => (
              <div key={f.tipoFalla}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{TIPOS_FALLA[f.tipoFalla as keyof typeof TIPOS_FALLA] ?? f.tipoFalla}</span>
                  <b>{f._count}</b>
                </div>
                <div className="h-2 rounded-full bg-zinc-100">
                  <div className="h-2 rounded-full bg-marca" style={{ width: `${(f._count / maxFalla) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {driven && (
          <section className="tarjeta">
            <h2 className="border-b border-zinc-100 px-5 py-3 font-semibold">Garantías por distribuidor</h2>
            <ul className="divide-y divide-zinc-100 text-sm">
              {porDistribuidor.map((d) => (
                <li key={d.distribuidorId} className="flex justify-between px-5 py-2.5">
                  <span>{distribuidores.find((x) => x.id === d.distribuidorId)?.razonSocial}</span>
                  <b>{d._count}</b>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`tarjeta ${driven ? "xl:col-span-2" : "xl:col-span-3"}`}>
          <h2 className="border-b border-zinc-100 px-5 py-3 font-semibold">Últimos movimientos</h2>
          <ul className="divide-y divide-zinc-100">
            {eventos.map((e) => (
              <li key={e.id}>
                <Link href={`/garantias/${e.garantiaId}`} className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-zinc-50">
                  <div className="min-w-0 text-sm">
                    <b>{numeroGarantia(e.garantiaId)}</b> · {e.garantia.producto.nombre}
                    <div className="truncate text-xs text-zinc-500">
                      {e.usuario.nombre}: {e.comentario ?? `pasó a ${ESTADOS[e.estadoNuevo as Estado]?.label}`}
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
    </>
  );
}
