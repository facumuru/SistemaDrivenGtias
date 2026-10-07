import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { filtroGarantias, requerirUsuario } from "@/lib/auth";
import {
  ESTADOS,
  RESOLUCIONES,
  TIPOS_DOCUMENTO,
  TIPOS_FALLA,
  esDriven,
  numeroGarantia,
  type Estado,
} from "@/lib/constantes";
import { fecha, fechaHora, pesos, tamanoArchivo, vencimientoGarantia } from "@/lib/formato";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Progreso } from "./Progreso";
import { Chat } from "./Chat";
import { PanelGestion } from "./PanelGestion";

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
      creadoPor: true,
      documentos: { include: { subidoPor: true }, orderBy: { creadoEn: "asc" } },
      mensajes: { include: { autor: true }, orderBy: { creadoEn: "asc" } },
      eventos: { include: { usuario: true }, orderBy: { creadoEn: "desc" } },
    },
  });
  if (!g) notFound();

  const { vence, vigente } = vencimientoGarantia(g.fechaCompra, g.producto.garantiaMeses);
  const notasCredito = g.documentos.filter((d) => d.tipo === "NOTA_CREDITO");
  const ultimoPedidoInfo = g.estado === "INFO_REQUERIDA" ? g.eventos.find((e) => e.estadoNuevo === "INFO_REQUERIDA") : null;
  const motivoRechazo = g.estado === "RECHAZADA" ? g.eventos.find((e) => e.estadoNuevo === "RECHAZADA") : null;

  return (
    <div className="space-y-6">
      {nueva && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✔ Garantía <b>{numeroGarantia(g.id)}</b> enviada a Driven. Te vamos a avisar acá cada cambio de estado.
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/garantias" className="text-xs text-zinc-500 hover:underline">← Volver a garantías</Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-bold text-tinta">
            {numeroGarantia(g.id)} <EstadoBadge estado={g.estado} />
          </h1>
          <p className="text-sm text-zinc-500">
            {g.producto.nombre} · cargada el {fechaHora(g.creadoEn)} por {g.creadoPor.nombre}
            {driven && ` (${g.distribuidor.razonSocial})`}
          </p>
        </div>
      </div>

      <Progreso estado={g.estado as Estado} eventos={g.eventos.map((e) => ({ estado: e.estadoNuevo, fecha: e.creadoEn }))} />

      {ultimoPedidoInfo && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
          <b>Driven necesita más información:</b> {ultimoPedidoInfo.comentario}
          {!driven && <div className="mt-1 text-xs">Respondé en el chat de abajo; la garantía vuelve a revisión automáticamente.</div>}
        </div>
      )}
      {motivoRechazo && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <b>Motivo del rechazo:</b> {motivoRechazo.comentario}
        </div>
      )}

      {g.resolucion && (
        <section className="tarjeta overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-tinta px-5 py-3 text-white">
            <h2 className="font-semibold">Resolución: {RESOLUCIONES[g.resolucion as keyof typeof RESOLUCIONES]}</h2>
            {g.motivoResolucion && <span className="text-xs text-zinc-300">Motivo: {g.motivoResolucion}</span>}
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            {g.resolucion === "NOTA_CREDITO" && (
              <>
                <Dato titulo="N° nota de crédito" valor={g.numeroNotaCredito ?? "Pendiente"} />
                <Dato titulo="Monto" valor={g.montoNotaCredito != null ? pesos(g.montoNotaCredito) : "Pendiente"} />
                <div>
                  <div className="text-xs font-medium text-zinc-500">Comprobante</div>
                  {notasCredito.length === 0 ? (
                    <div className="text-sm text-zinc-500">Driven todavía no subió el PDF</div>
                  ) : (
                    notasCredito.map((d) => (
                      <a key={d.id} href={`/api/archivos/${d.id}`} target="_blank" className="btn-primario mt-1 text-xs">
                        ⬇ Descargar nota de crédito
                      </a>
                    ))
                  )}
                </div>
              </>
            )}
            {g.diagnostico && (
              <div className="sm:col-span-3">
                <Dato titulo="Diagnóstico técnico" valor={g.diagnostico} />
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="tarjeta grid gap-5 p-5 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-bold tracking-wide text-marca uppercase">Producto</h3>
              <Dato titulo="Producto" valor={`${g.producto.nombre} (${g.producto.codigo})`} />
              <Dato titulo="N° de serie / lote" valor={[g.numeroSerie, g.lote].filter(Boolean).join(" / ") || "—"} />
              <Dato titulo="Compra" valor={`${fecha(g.fechaCompra)}${g.numeroFactura ? ` · Factura ${g.numeroFactura}` : ""}`} />
              <div>
                <div className="text-xs font-medium text-zinc-500">Vigencia</div>
                <div className={`text-sm font-semibold ${vigente ? "text-emerald-700" : "text-red-700"}`}>
                  {vigente ? "Dentro de garantía" : "Fuera de garantía"} (vence {fecha(vence)})
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-bold tracking-wide text-marca uppercase">Falla y cliente</h3>
              <Dato titulo="Tipo de falla" valor={TIPOS_FALLA[g.tipoFalla as keyof typeof TIPOS_FALLA] ?? g.tipoFalla} />
              <Dato titulo="Descripción" valor={g.descripcionFalla} />
              <Dato
                titulo="Cliente final"
                valor={[g.clienteNombre, g.clienteDni && `DNI ${g.clienteDni}`, g.clienteTelefono, g.clienteEmail]
                  .filter(Boolean)
                  .join(" · ")}
              />
              {driven && <Dato titulo="Distribuidor" valor={`${g.distribuidor.razonSocial} · CUIT ${g.distribuidor.cuit}`} />}
            </div>
          </section>

          <section className="tarjeta">
            <h2 className="border-b border-zinc-100 px-5 py-3 font-semibold">Documentos ({g.documentos.length})</h2>
            {g.documentos.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">Sin documentos.</p>
            ) : (
              <ul className="grid gap-3 p-5 sm:grid-cols-2">
                {g.documentos.map((d) => (
                  <li key={d.id}>
                    <a
                      href={`/api/archivos/${d.id}`}
                      target="_blank"
                      className={`flex items-center gap-3 rounded-lg border p-3 hover:bg-zinc-50 ${
                        d.tipo === "NOTA_CREDITO" ? "border-marca bg-orange-50/50" : "border-zinc-200"
                      }`}
                    >
                      {d.mime.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/archivos/${d.id}`} alt="" className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <span className="grid h-12 w-12 place-items-center rounded bg-zinc-100 text-xs font-bold text-zinc-500">
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
        </div>

        <div className="space-y-6">
          {driven && (
            <PanelGestion
              key={g.actualizadoEn.getTime()}
              garantia={{
                id: g.id,
                estado: g.estado,
                resolucion: g.resolucion,
                motivoResolucion: g.motivoResolucion,
                diagnostico: g.diagnostico,
                numeroNotaCredito: g.numeroNotaCredito,
                montoNotaCredito: g.montoNotaCredito,
              }}
            />
          )}

          <section className="tarjeta">
            <h2 className="border-b border-zinc-100 px-5 py-3 font-semibold">Historial</h2>
            <ol className="relative space-y-5 p-5">
              {g.eventos.map((e) => (
                <li key={e.id} className="relative border-l-2 border-zinc-200 pl-4">
                  <span className="absolute top-1 -left-[7px] h-3 w-3 rounded-full bg-marca ring-4 ring-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <EstadoBadge estado={e.estadoNuevo} />
                    <span className="text-[11px] text-zinc-400">{fechaHora(e.creadoEn)}</span>
                  </div>
                  {e.comentario && <p className="mt-1 text-sm">{e.comentario}</p>}
                  <p className="text-xs text-zinc-500">
                    {e.usuario.nombre}
                    {e.estadoAnterior && e.estadoAnterior !== e.estadoNuevo &&
                      ` · desde ${ESTADOS[e.estadoAnterior as Estado]?.label}`}
                  </p>
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
