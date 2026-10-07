import Link from "next/link";
import { db } from "@/lib/db";
import type { UsuarioSesion } from "@/lib/auth";
import { ESTADOS, TIPOS_FALLA, type Estado } from "@/lib/constantes";
import { incluirVista, tieneNovedad } from "@/lib/novedades";
import { TarjetaGarantia, diasDesde } from "@/components/TarjetaGarantia";

const COLUMNAS: { estado: Estado; titulo: string; ayuda: string }[] = [
  { estado: "CARGADA", titulo: "Nuevas", ayuda: "Esperando el equipo" },
  { estado: "EQUIPO_RECIBIDO", titulo: "Equipo recibido", ayuda: "Para revisar" },
  { estado: "EN_REVISION", titulo: "En revisión", ayuda: "Decidir si corresponde" },
  { estado: "INFO_REQUERIDA", titulo: "Esperando al distribuidor", ayuda: "Se pidió información" },
  { estado: "APROBADA", titulo: "Aprobadas", ayuda: "Entregar resolución" },
];

export async function BandejaDriven({ usuario }: { usuario: UsuarioSesion }) {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [abiertas, finalizadasMes, rechazadasMes, porFalla, porDistribuidor, cerradas] = await Promise.all([
    db.garantia.findMany({
      where: { estado: { in: COLUMNAS.map((c) => c.estado) } },
      include: {
        producto: true,
        distribuidor: true,
        sucursal: true,
        ...incluirVista(usuario.id),
        eventos: { orderBy: { creadoEn: "desc" }, take: 1 },
      },
      orderBy: { creadoEn: "asc" },
    }),
    db.evento.count({ where: { estadoNuevo: "FINALIZADA", estadoAnterior: { not: "FINALIZADA" }, creadoEn: { gte: inicioMes } } }),
    db.evento.count({ where: { estadoNuevo: "RECHAZADA", creadoEn: { gte: inicioMes } } }),
    db.garantia.groupBy({ by: ["tipoFalla"], _count: true, orderBy: { _count: { tipoFalla: "desc" } }, take: 6 }),
    db.garantia.groupBy({ by: ["distribuidorId"], _count: true, orderBy: { _count: { distribuidorId: "desc" } } }),
    db.garantia.findMany({
      where: { estado: "FINALIZADA" },
      select: { creadoEn: true, eventos: { where: { estadoNuevo: "FINALIZADA" }, orderBy: { creadoEn: "asc" }, take: 1 } },
    }),
  ]);

  const distribuidores = await db.distribuidor.findMany({ where: { id: { in: porDistribuidor.map((d) => d.distribuidorId) } } });
  const tiempos = cerradas.filter((c) => c.eventos[0]).map((c) => diasDesde(c.creadoEn) - diasDesde(c.eventos[0].creadoEn));
  const promedio = tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : null;
  const demoradas = abiertas.filter((g) => diasDesde(g.eventos[0]?.creadoEn ?? g.creadoEn) >= 7).length;
  const maxFalla = Math.max(1, ...porFalla.map((f) => f._count));

  const indicadores = [
    { label: "Abiertas", valor: abiertas.length },
    { label: "Demoradas (+7 días sin cambios)", valor: demoradas, alerta: demoradas > 0 },
    { label: "Resueltas este mes", valor: finalizadasMes },
    { label: "Rechazadas este mes", valor: rechazadasMes },
    { label: "Días promedio de resolución", valor: promedio ?? "—" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="titulo-seccion">Servicio técnico Driven</p>
          <h1 className="mt-1 text-3xl font-black">Bandeja de trabajo</h1>
          <p className="mt-1 text-sm text-zinc-500">Cada columna es un paso. Hacé clic en una garantía para avanzarla.</p>
        </div>
        <form action="/garantias" className="flex gap-2">
          <input name="q" placeholder="Buscar n°, cliente, serie..." className="campo w-64" />
          <button className="btn-primario">Buscar</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {indicadores.map((i) => (
          <div key={i.label} className={`tarjeta p-4 ${i.alerta ? "border-red-200 bg-red-50" : ""}`}>
            <div className={`text-3xl font-black ${i.alerta ? "text-red-700" : ""}`}>{i.valor}</div>
            <div className="mt-1 text-xs font-medium text-zinc-500">{i.label}</div>
          </div>
        ))}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
        <div className="grid min-w-[1100px] grid-cols-5 gap-4">
          {COLUMNAS.map((c) => {
            const items = abiertas.filter((g) => g.estado === c.estado);
            return (
              <section key={c.estado} className="flex flex-col rounded-2xl bg-zinc-200/50 p-3">
                <header className="mb-3 px-1">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-bold">
                      <span className={`h-2 w-2 rounded-full ${ESTADOS[c.estado].punto}`} />
                      {c.titulo}
                    </h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">{items.length}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{c.ayuda}</p>
                </header>
                <div className="space-y-2.5">
                  {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-zinc-400">Nada por acá</p>}
                  {items.map((g) => (
                    <TarjetaGarantia
                      key={g.id}
                      g={{
                        id: g.id,
                        estado: g.estado,
                        producto: g.producto.nombre,
                        tipoFalla: g.tipoFalla,
                        cliente: g.clienteNombre,
                        ubicacion: `${g.distribuidor.razonSocial} · ${g.sucursal.nombre}`,
                        dias: diasDesde(g.eventos[0]?.creadoEn ?? g.creadoEn),
                        novedad: tieneNovedad(usuario, g),
                      }}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="tarjeta p-5">
          <h2 className="mb-4 font-bold">Fallas más frecuentes</h2>
          <div className="space-y-3">
            {porFalla.map((f) => (
              <div key={f.tipoFalla}>
                <div className="mb-1 flex justify-between text-sm">
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
        <section className="tarjeta overflow-hidden">
          <h2 className="px-5 pt-5 pb-3 font-bold">Garantías por distribuidor</h2>
          <ul className="divide-y divide-zinc-100 text-sm">
            {porDistribuidor.map((d) => (
              <li key={d.distribuidorId}>
                <Link href={`/garantias?distribuidor=${d.distribuidorId}`} className="flex justify-between px-5 py-3 hover:bg-zinc-50">
                  <span>{distribuidores.find((x) => x.id === d.distribuidorId)?.razonSocial}</span>
                  <b>{d._count}</b>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
