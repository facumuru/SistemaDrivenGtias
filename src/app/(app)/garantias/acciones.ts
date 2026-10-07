"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { garantiaVisible, requerirDriven, requerirUsuario } from "@/lib/auth";
import { archivosDelForm, guardarArchivo, validarArchivo } from "@/lib/archivos";
import { ESTADOS, RESOLUCIONES, TIPOS_DOCUMENTO, TIPOS_FALLA, esDriven } from "@/lib/constantes";
import type { EstadoForm } from "@/app/login/acciones";

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;

export async function crearGarantia(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = await requerirUsuario();
  if (esDriven(usuario.rol) || !usuario.distribuidorId)
    return { error: "Solo los distribuidores pueden cargar garantías." };

  const productoId = texto(form, "productoId");
  const fechaCompra = texto(form, "fechaCompra");
  const tipoFalla = texto(form, "tipoFalla");
  const descripcionFalla = texto(form, "descripcionFalla");
  const clienteNombre = texto(form, "clienteNombre");

  if (!productoId || !fechaCompra || !tipoFalla || !descripcionFalla || !clienteNombre)
    return { error: "Completá todos los campos obligatorios (*)." };
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

  const garantia = await db.garantia.create({
    data: {
      distribuidorId: usuario.distribuidorId,
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
      eventos: {
        create: { usuarioId: usuario.id, estadoNuevo: "CARGADA", comentario: "Garantía cargada por el distribuidor" },
      },
    },
  });

  for (const a of facturas) {
    const datos = await guardarArchivo(garantia.id, a);
    await db.documento.create({ data: { ...datos, garantiaId: garantia.id, tipo: "FACTURA_COMPRA", subidoPorId: usuario.id } });
  }
  for (const a of fotos) {
    const datos = await guardarArchivo(garantia.id, a);
    const tipo = a.type.startsWith("video/") ? "VIDEO" : "FOTO";
    await db.documento.create({ data: { ...datos, garantiaId: garantia.id, tipo, subidoPorId: usuario.id } });
  }

  revalidatePath("/garantias");
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
    const tipo = a.type.startsWith("image/") ? "FOTO" : a.type.startsWith("video/") ? "VIDEO" : "OTRO";
    await db.documento.create({ data: { ...datos, garantiaId: id, tipo, subidoPorId: usuario.id } });
  }

  // Cuando el distribuidor responde a un pedido de info, la garantía vuelve a revisión.
  if (!esDriven(usuario.rol) && garantia.estado === "INFO_REQUERIDA") {
    await db.garantia.update({ where: { id }, data: { estado: "EN_REVISION" } });
    await db.evento.create({
      data: {
        garantiaId: id,
        usuarioId: usuario.id,
        estadoAnterior: "INFO_REQUERIDA",
        estadoNuevo: "EN_REVISION",
        comentario: "El distribuidor respondió el pedido de información",
      },
    });
  } else {
    await db.garantia.update({ where: { id }, data: { actualizadoEn: new Date() } });
  }

  revalidatePath(`/garantias/${id}`);
  return { ok: "Enviado" };
}

export async function gestionarGarantia(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = await requerirDriven();
  const id = Number(form.get("garantiaId"));
  const garantia = await db.garantia.findUnique({ where: { id } });
  if (!garantia) return { error: "Garantía no encontrada." };

  const estado = texto(form, "estado");
  if (!(estado in ESTADOS)) return { error: "Estado inválido." };

  const resolucion = opcional(form, "resolucion");
  if (resolucion && !(resolucion in RESOLUCIONES)) return { error: "Resolución inválida." };
  if ((estado === "APROBADA" || estado === "FINALIZADA") && !resolucion && garantia.estado !== "RECHAZADA")
    return { error: "Indicá la resolución (cambio, reparación o nota de crédito)." };

  const comentario = opcional(form, "comentario");
  if ((estado === "RECHAZADA" || estado === "INFO_REQUERIDA") && !comentario)
    return { error: "Explicá el motivo en el comentario: el distribuidor lo va a ver." };

  const montoTxt = texto(form, "montoNotaCredito").replace(/\./g, "").replace(",", ".");
  const monto = montoTxt ? Number(montoTxt) : null;
  if (monto !== null && Number.isNaN(monto)) return { error: "El monto de la nota de crédito no es válido." };

  const archivoNC = archivosDelForm(form, "archivoNotaCredito");
  const otros = archivosDelForm(form, "documentos");
  for (const a of [...archivoNC, ...otros]) {
    const err = validarArchivo(a);
    if (err) return { error: err };
  }

  const esNC = resolucion === "NOTA_CREDITO";
  await db.garantia.update({
    where: { id },
    data: {
      estado,
      resolucion: estado === "RECHAZADA" ? null : resolucion ?? garantia.resolucion,
      motivoResolucion: esNC ? opcional(form, "motivoResolucion") : garantia.motivoResolucion,
      diagnostico: opcional(form, "diagnostico") ?? garantia.diagnostico,
      numeroNotaCredito: esNC ? opcional(form, "numeroNotaCredito") ?? garantia.numeroNotaCredito : garantia.numeroNotaCredito,
      montoNotaCredito: esNC ? monto ?? garantia.montoNotaCredito : garantia.montoNotaCredito,
    },
  });

  const cambioEstado = estado !== garantia.estado;
  if (cambioEstado || comentario || archivoNC.length || otros.length) {
    await db.evento.create({
      data: {
        garantiaId: id,
        usuarioId: usuario.id,
        estadoAnterior: garantia.estado,
        estadoNuevo: estado,
        comentario:
          comentario ??
          (archivoNC.length ? "Se adjuntó la nota de crédito" : !cambioEstado ? "Se actualizaron los datos" : null),
      },
    });
  }

  for (const a of archivoNC) {
    const datos = await guardarArchivo(id, a);
    await db.documento.create({ data: { ...datos, garantiaId: id, tipo: "NOTA_CREDITO", subidoPorId: usuario.id } });
  }
  const tipoOtros = texto(form, "tipoDocumento");
  for (const a of otros) {
    const datos = await guardarArchivo(id, a);
    const tipo = tipoOtros in TIPOS_DOCUMENTO ? tipoOtros : "OTRO";
    await db.documento.create({ data: { ...datos, garantiaId: id, tipo, subidoPorId: usuario.id } });
  }

  revalidatePath(`/garantias/${id}`);
  revalidatePath("/garantias");
  return { ok: "Garantía actualizada" };
}
