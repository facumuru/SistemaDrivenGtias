"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { garantiaVisible, requerirDriven, requerirUsuario } from "@/lib/auth";
import { archivosDelForm, guardarArchivo, validarArchivo } from "@/lib/archivos";
import { campoActividad, marcarVista } from "@/lib/novedades";
import { ACCIONES_DRIVEN, RESOLUCIONES, TIPOS_FALLA, esDriven, type Estado } from "@/lib/constantes";
import type { EstadoForm } from "@/app/login/acciones";

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;

function tipoPorMime(mime: string) {
  return mime.startsWith("image/") ? "FOTO" : mime.startsWith("video/") ? "VIDEO" : "OTRO";
}

export async function crearGarantia(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = await requerirUsuario();
  if (esDriven(usuario.rol) || !usuario.distribuidorId)
    return { error: "Solo los distribuidores pueden cargar garantías." };

  const sucursalId = usuario.sucursalId ?? texto(form, "sucursalId");
  const sucursal = await db.sucursal.findFirst({
    where: { id: sucursalId, distribuidorId: usuario.distribuidorId, activa: true },
  });
  if (!sucursal) return { error: "Elegí la sucursal que carga la garantía." };

  const productoId = texto(form, "productoId");
  const fechaCompra = texto(form, "fechaCompra");
  const tipoFalla = texto(form, "tipoFalla");
  const descripcionFalla = texto(form, "descripcionFalla");
  const clienteNombre = texto(form, "clienteNombre");

  if (!productoId || !fechaCompra || !tipoFalla || !descripcionFalla || !clienteNombre)
    return { error: "Faltan datos obligatorios." };
  if (!(tipoFalla in TIPOS_FALLA)) return { error: "Tipo de falla inválido." };

  const fecha = new Date(`${fechaCompra}T12:00:00`);
  if (Number.isNaN(fecha.getTime()) || fecha.getTime() > Date.now())
    return { error: "La fecha de compra no es válida." };

  const producto = await db.producto.findFirst({ where: { id: productoId, activo: true } });
  if (!producto) return { error: "Producto inválido." };

  const facturas = archivosDelForm(form, "factura");
  const fotos = archivosDelForm(form, "fotos");
  if (facturas.length === 0) return { error: "Adjuntá la factura de compra." };
  for (const a of [...facturas, ...fotos]) {
    const err = validarArchivo(a);
    if (err) return { error: err };
  }

  const ahora = new Date();
  const garantia = await db.garantia.create({
    data: {
      distribuidorId: usuario.distribuidorId,
      sucursalId: sucursal.id,
      creadoPorId: usuario.id,
      productoId,
      numeroSerie: opcional(form, "numeroSerie"),
      lote: opcional(form, "lote"),
      fechaCompra: fecha,
      numeroFactura: opcional(form, "numeroFactura"),
      tipoFalla,
      descripcionFalla,
      clienteNombre,
      clienteDni: opcional(form, "clienteDni"),
      clienteTelefono: opcional(form, "clienteTelefono"),
      clienteEmail: opcional(form, "clienteEmail"),
      actividadDistEn: ahora,
      eventos: { create: { usuarioId: usuario.id, estadoNuevo: "CARGADA", comentario: `Cargada por ${sucursal.nombre}` } },
      vistas: { create: { usuarioId: usuario.id, vistoEn: ahora } },
    },
  });

  for (const a of facturas) {
    const datos = await guardarArchivo(garantia.id, a);
    await db.documento.create({ data: { ...datos, garantiaId: garantia.id, tipo: "FACTURA_COMPRA", subidoPorId: usuario.id } });
  }
  for (const a of fotos) {
    const datos = await guardarArchivo(garantia.id, a);
    await db.documento.create({ data: { ...datos, garantiaId: garantia.id, tipo: tipoPorMime(a.type), subidoPorId: usuario.id } });
  }

  revalidatePath("/", "layout");
  redirect(`/garantias/${garantia.id}?nueva=1`);
}

export async function enviarMensaje(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = await requerirUsuario();
  const id = Number(form.get("garantiaId"));
  const garantia = await garantiaVisible(usuario, id);
  if (!garantia) return { error: "Garantía no encontrada." };

  const mensaje = texto(form, "texto");
  const adjuntos = archivosDelForm(form, "adjuntos");
  if (!mensaje && adjuntos.length === 0) return { error: "Escribí un mensaje o adjuntá un archivo." };
  for (const a of adjuntos) {
    const err = validarArchivo(a);
    if (err) return { error: err };
  }

  if (mensaje) await db.mensaje.create({ data: { garantiaId: id, autorId: usuario.id, texto: mensaje } });
  for (const a of adjuntos) {
    const datos = await guardarArchivo(id, a);
    await db.documento.create({ data: { ...datos, garantiaId: id, tipo: tipoPorMime(a.type), subidoPorId: usuario.id } });
  }

  const respondeInfo = !esDriven(usuario.rol) && garantia.estado === "INFO_REQUERIDA";
  await db.garantia.update({
    where: { id },
    data: { [campoActividad(usuario.rol)]: new Date(), ...(respondeInfo ? { estado: "EN_REVISION" } : {}) },
  });
  if (respondeInfo) {
    await db.evento.create({
      data: {
        garantiaId: id,
        usuarioId: usuario.id,
        estadoAnterior: "INFO_REQUERIDA",
        estadoNuevo: "EN_REVISION",
        comentario: "El distribuidor respondió la consulta",
      },
    });
  }
  await marcarVista(usuario.id, id);

  revalidatePath("/", "layout");
  return { ok: respondeInfo ? "Respuesta enviada. La garantía volvió a revisión." : "Enviado" };
}

export async function accionDriven(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = await requerirDriven();
  const id = Number(form.get("garantiaId"));
  const g = await db.garantia.findUnique({ where: { id } });
  if (!g) return { error: "Garantía no encontrada." };

  const destino = texto(form, "destino") as Estado;
  const accion = ACCIONES_DRIVEN[g.estado as Estado]?.find((a) => a.destino === destino);
  if (!accion) return { error: "Esa acción ya no está disponible. Recargá la página." };

  const comentario = opcional(form, "comentario");
  if (accion.comentarioObligatorio && !comentario) return { error: accion.ayuda ?? "Escribí un comentario." };

  const pide = accion.pide ?? [];
  const resolucion = pide.includes("resolucion") ? opcional(form, "resolucion") : g.resolucion;
  if (pide.includes("resolucion")) {
    if (!resolucion || !(resolucion in RESOLUCIONES)) return { error: "Elegí cómo se resuelve la garantía." };
  }

  const esNC = resolucion === "NOTA_CREDITO";
  let monto: number | null = g.montoNotaCredito;
  if (pide.includes("entrega") && esNC) {
    const montoTxt = texto(form, "montoNotaCredito").replace(/\./g, "").replace(",", ".");
    if (montoTxt) {
      monto = Number(montoTxt);
      if (Number.isNaN(monto) || monto < 0) return { error: "El monto de la nota de crédito no es válido." };
    }
  }

  const archivoNC = archivosDelForm(form, "archivoNotaCredito");
  const otros = archivosDelForm(form, "documentos");
  for (const a of [...archivoNC, ...otros]) {
    const err = validarArchivo(a);
    if (err) return { error: err };
  }

  const entrega = pide.includes("entrega");
  await db.garantia.update({
    where: { id },
    data: {
      estado: destino,
      resolucion: destino === "RECHAZADA" ? null : resolucion,
      diagnostico: pide.includes("diagnostico") ? opcional(form, "diagnostico") ?? g.diagnostico : g.diagnostico,
      motivoResolucion: esNC ? opcional(form, "motivoResolucion") ?? g.motivoResolucion : null,
      numeroNotaCredito: entrega && esNC ? opcional(form, "numeroNotaCredito") ?? g.numeroNotaCredito : g.numeroNotaCredito,
      montoNotaCredito: entrega && esNC ? monto : g.montoNotaCredito,
      remitoEnvio: entrega && !esNC ? opcional(form, "remitoEnvio") ?? g.remitoEnvio : g.remitoEnvio,
      actividadDrivenEn: new Date(),
    },
  });

  await db.evento.create({
    data: {
      garantiaId: id,
      usuarioId: usuario.id,
      estadoAnterior: g.estado,
      estadoNuevo: destino,
      comentario: comentario ?? (destino === g.estado ? "Se actualizó la resolución" : null),
    },
  });

  for (const a of archivoNC) {
    const datos = await guardarArchivo(id, a);
    await db.documento.create({ data: { ...datos, garantiaId: id, tipo: "NOTA_CREDITO", subidoPorId: usuario.id } });
  }
  for (const a of otros) {
    const datos = await guardarArchivo(id, a);
    const tipo = a.type === "application/pdf" ? (entrega ? "REMITO" : "INFORME_TECNICO") : tipoPorMime(a.type);
    await db.documento.create({ data: { ...datos, garantiaId: id, tipo, subidoPorId: usuario.id } });
  }
  await marcarVista(usuario.id, id);

  revalidatePath("/", "layout");
  return { ok: "Listo" };
}
