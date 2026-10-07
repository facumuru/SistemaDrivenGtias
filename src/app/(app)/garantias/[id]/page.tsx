import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { filtroGarantias, requerirUsuario } from "@/lib/auth";
import { marcarVista } from "@/lib/novedades";
import { ESTADOS, QUE_SIGUE, RESOLUCIONES, TIPOS_DOCUMENTO, TIPOS_FALLA, esDriven, numeroGarantia, type Estado } from "@/lib/constantes";
import { fecha, fechaHora, pesos, tamanoArchivo, vencimientoGarantia } from "@/lib/formato";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Progreso } from "./Progreso";
import { Chat } from "./Chat";
import { AccionesDriven } from "./AccionesDriven";
import { RespuestaRapida } from "./RespuestaRapida";

const FONDO_ESTADO: Record<Estado, string> = {
  CARGADA: "bg-sky-50 border-sky-200",
  EQUIPO_RECIBIDO: "bg-indigo-50 border-indigo-200",
  EN_REVISION: "bg-amber-50 border-amber-200",
  INFO_REQUERIDA: "bg-purple-50 border-purple-300",
  APROBADA: "bg-emerald-50 border-emerald-200",
  RECHAZADA: "bg-red-50 border-red-200",
  FINALIZADA: "bg-zinc-50 border-zinc-300",
};

export default async function DetalleGarantiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const usuario = await requerirUsuario();
  const driven = esDriven(usuario.rol);
  const id = Number((await params).id);
  const { nueva } = await searchParams;
  if (!Number.isInteger(id)) notFound();

  const g = await db.garantia.findFirst({
    where: { id, ...filtroGarantias(usuario) },
    include: {
      producto: true,
      distribuidor: true,
      sucursal: true,
      creadoPor: true,
      documentos: { include: { subidoPor: true }, orderBy: { creadoEn: "asc" } },
      mensajes: { include: { autor: true }, orderBy: { creadoEn: "asc" } },
      eventos: { include: { usuario: true }, orderBy: { creadoEn: "desc" } },
    },
  });
  if (!g) notFound();
  await marcarVista(usuario.id, g.id);

  const estado = g.estado as Estado;
  const sigue = QUE_SIGUE[estado];
  const { vence, vigente } = vencimientoGarantia(g.fechaCompra, g.producto.garantiaMeses);
  const notasCredito = g.documentos.filter((d) => d.tipo === "NOTA_CREDITO");
  const ultimoEvento = g.eventos.find((e) => e.estadoNuevo === estado && e.comentario);

  return (
    <div className="space-y-6">
      {nueva && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
          <b>✓ ¡Listo! Garantía {numeroGarantia(g.id)} enviada a Driven.</b> Te vamos a avisar acá cada vez que cambie de estado.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/garantias" className="text-sm text-zinc-500 hover:text-tinta">← Volver</Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tabular-nums">{numeroGarantia(g.id)}</h1>
            <EstadoBadge estado={g.estado} grande />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {g.producto.nombre} · {driven ? `${g.distribuidor.razonSocial} · ` : ""}Sucursal {g.sucursal.nombre}
          </p>
        </div>
        <Link href={`/imprimir/${g.id}`} target="_blank" className="btn-secundario">🖨 Imprimir comprobante</Link>
      </div>

      <section className={`rounded-2xl border-2 p-6 ${FONDO_ESTADO[estado]}`}>
        <div className="mb-6">
          <Progreso estado={estado} eventos={g.eventos.map((e) => ({ estado: e.estadoNuevo, fecha: e.creadoEn }))} />
        </div>
        <div className="rounded-2xl bg-white/70 p-5">
          <h2 className="text-xl font-black">{sigue.titulo}</h2>
          <p className="mt-1 text-zinc-700">
            <span className="font-semibold">¿Qué sigue? </span>
            {driven ? sigue.driven : sigue.dist}
          </p>
          {ultimoEvento?.comentario && (estado === "INFO_REQUERIDA" || estado === "RECHAZADA" || estado === "APROBADA") && (
            <blockquote className="mt-4 rounded-xl border-l-4 border-tinta bg-white px-4 py-3 text-sm">
              <div className="text-xs font-semibold text-zinc-500">{ultimoEvento.usuario.nombre} · Driven · {fechaHora(ultimoEvento.creadoEn)}</div>
              {ultimoEvento.comentario}
            </blockquote>
          )}
          {!driven && estado === "INFO_REQUERIDA" && <RespuestaRapida garantiaId={g.id} />}
          {driven && (
            <div className="mt-5">
              <AccionesDriven
                key={g.actualizadoEn.getTime()}
                garantia={{
                  id: g.id,
                  estado: g.estado,
                  resolucion: g.resolucion,
                  motivoResolucion: g.motivoResolucion,
                  diagnostico: g.diagnostico,
                  numeroNotaCredito: g.numeroNotaCredito,
                  montoNotaCredito: g.montoNotaCredito,
                  remitoEnvio: g.remitoEnvio,
                }}
              />
            </div>
          )}
        </div>
      </section>

      {(g.resolucion || g.diagnostico) && (
        <section className="tarjeta overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-tinta px-6 py-4 text-white">
            <h2 className="text-lg font-bold">
              {g.resolucion ? `Resolución: ${RESOLUCIONES[g.resolucion as keyof typeof RESOLUCIONES].label}` : "Diagnóstico técnico"}
            </h2>
            {g.motivoResolucion && <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{g.motivoResolucion}</span>}
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-3">
            {g.resolucion === "NOTA_CREDITO" && (
              <>
                <Dato titulo="N° de nota de crédito" valor={g.numeroNotaCredito ?? "Pendiente"} />
                <Dato titulo="Monto" valor={g.montoNotaCredito != null ? pesos(g.montoNotaCredito) : "Pendiente"} />
                <div>
                  <div className="text-xs font-medium text-zinc-500">Comprobante</div>
                  {notasCredito.length === 0 ? (
                    <div className="text-sm text-zinc-500">Driven todavía no subió el PDF</div>
                  ) : (
                    notasCredito.map((d) => (
                      <a key={d.id} href={`/api/archivos/${d.id}`} target="_blank" className="btn-marca mt-1">⬇ Descargar nota de crédito</a>
                    ))
                  )}
                </div>
              </>
            )}
            {g.resolucion && g.resolucion !== "NOTA_CREDITO" && (
              <Dato titulo="Remito / seguimiento del envío" valor={g.remitoEnvio ?? (estado === "FINALIZADA" ? "—" : "Driven lo informa al enviar")} />
            )}
            {g.diagnostico && (
              <div className="sm:col-span-3">
                <Dato titulo="Diagnóstico del servicio técnico" valor={g.diagnostico} />
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Chat
            garantiaId={g.id}
            usuarioId={usuario.id}
            mensajes={g.mensajes.map((m) => ({
              id: m.id,
              texto: m.texto,
              autor: m.autor.nombre,
              autorId: m.autorId,
              deDriven: esDriven(m.autor.rol),
              fecha: fechaHora(m.creadoEn),
            }))}
          />

          <section className="tarjeta">
            <h2 className="border-b border-zinc-100 px-5 py-4 font-bold">📁 Archivos ({g.documentos.length})</h2>
            {g.documentos.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">Sin archivos.</p>
            ) : (
              <ul className="grid gap-3 p-5 sm:grid-cols-2">
                {g.documentos.map((d) => (
                  <li key={d.id}>
                    <a
                      href={`/api/archivos/${d.id}`}
                      target="_blank"
                      className={`flex items-center gap-3 rounded-xl border p-3 transition hover:border-tinta ${
                        d.tipo === "NOTA_CREDITO" ? "border-marca bg-marca-claro" : "border-zinc-200"
                      }`}
                    >
                      {d.mime.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/archivos/${d.id}`} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-12 w-12 place-items-center rounded-lg bg-zinc-100 text-[10px] font-bold text-zinc-500">
                          {d.mime === "application/pdf" ? "PDF" : d.mime.startsWith("video/") ? "VIDEO" : "ARCH"}
                        </span>
                      )}
                      <div className="min-w-0 text-sm">
                        <div className="font-semibold">{TIPOS_DOCUMENTO[d.tipo as keyof typeof TIPOS_DOCUMENTO] ?? d.tipo}</div>
                        <div className="truncate text-xs text-zinc-500">{d.nombreOriginal}</div>
                        <div className="text-[11px] text-zinc-400">
                          {d.subidoPor.nombre} · {fecha(d.creadoEn)} · {tamanoArchivo(d.tamano)}
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="tarjeta space-y-4 p-5">
            <h2 className="font-bold">Datos de la garantía</h2>
            <Dato titulo="Producto" valor={`${g.producto.nombre} (${g.producto.codigo})`} />
            <Dato titulo="N° de serie" valor={g.numeroSerie ?? "—"} />
            <Dato titulo="Compra" valor={`${fecha(g.fechaCompra)}${g.numeroFactura ? ` · Factura ${g.numeroFactura}` : ""}`} />
            <div>
              <div className="text-xs font-medium text-zinc-500">Vigencia</div>
              <div className={`text-sm font-semibold ${vigente ? "text-emerald-700" : "text-red-700"}`}>
                {vigente ? "✓ Dentro de garantía" : "✕ Fuera de garantía"} · vence {fecha(vence)}
              </div>
            </div>
            <hr className="border-zinc-100" />
            <Dato titulo="Falla" valor={TIPOS_FALLA[g.tipoFalla as keyof typeof TIPOS_FALLA] ?? g.tipoFalla} />
            <Dato titulo="Descripción" valor={g.descripcionFalla} />
            <hr className="border-zinc-100" />
            <Dato titulo="Cliente final" valor={[g.clienteNombre, g.clienteDni && `DNI/CUIT ${g.clienteDni}`].filter(Boolean).join(" · ")} />
            {(g.clienteTelefono || g.clienteEmail) && <Dato titulo="Contacto" valor={[g.clienteTelefono, g.clienteEmail].filter(Boolean).join(" · ")} />}
            <hr className="border-zinc-100" />
            <Dato
              titulo="Cargada por"
              valor={`${g.creadoPor.nombre}${driven ? ` · ${g.distribuidor.razonSocial}` : ""} · Sucursal ${g.sucursal.nombre} · ${fechaHora(g.creadoEn)}`}
            />
          </section>

          <section className="tarjeta p-5">
            <h2 className="mb-4 font-bold">Historial</h2>
            <ol className="space-y-4">
              {g.eventos.map((e) => (
                <li key={e.id} className="relative border-l-2 border-zinc-200 pl-4">
                  <span className={`absolute top-1.5 -left-[5px] h-2 w-2 rounded-full ${ESTADOS[e.estadoNuevo as Estado]?.punto ?? "bg-zinc-400"}`} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{ESTADOS[e.estadoNuevo as Estado]?.label}</span>
                    <span className="text-[11px] text-zinc-400">{fechaHora(e.creadoEn)}</span>
                  </div>
                  {e.comentario && <p className="text-sm text-zinc-700">{e.comentario}</p>}
                  <p className="text-xs text-zinc-500">{e.usuario.nombre}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-zinc-500">{titulo}</div>
      <div className="text-sm whitespace-pre-line">{valor}</div>
    </div>
  );
}
