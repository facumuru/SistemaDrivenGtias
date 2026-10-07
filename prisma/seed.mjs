import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const db = new PrismaClient();
const UPLOADS = path.join(process.cwd(), "uploads");
const haceDias = (d, horas = 10) => {
  const f = new Date();
  f.setDate(f.getDate() - d);
  f.setHours(horas, 0, 0, 0);
  return f;
};

function pdfSimple(lineas) {
  const contenido = lineas.map((l, i) => `BT /F1 ${i === 0 ? 18 : 12} Tf 60 ${760 - i * 26} Td (${l}) Tj ET`).join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (pdf += `${String(o).padStart(10, "0")} 00000 n \n`));
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

async function adjuntarPdf(garantiaId, tipo, nombre, lineas, subidoPorId, creadoEn) {
  const carpeta = path.join(UPLOADS, String(garantiaId));
  await mkdir(carpeta, { recursive: true });
  const archivo = `${tipo.toLowerCase()}-${garantiaId}.pdf`;
  const buffer = pdfSimple(lineas);
  await writeFile(path.join(carpeta, archivo), buffer);
  await db.documento.create({
    data: {
      garantiaId,
      tipo,
      nombreOriginal: nombre,
      ruta: path.join(String(garantiaId), archivo),
      mime: "application/pdf",
      tamano: buffer.length,
      subidoPorId,
      creadoEn,
    },
  });
}

async function main() {
  await db.documento.deleteMany();
  await db.mensaje.deleteMany();
  await db.evento.deleteMany();
  await db.garantia.deleteMany();
  await db.usuario.deleteMany();
  await db.producto.deleteMany();
  await db.distribuidor.deleteMany();
  await rm(UPLOADS, { recursive: true, force: true });

  const hash = await bcrypt.hash("demo1234", 10);

  const miDist = await db.distribuidor.create({
    data: {
      razonSocial: "Mi Distribuidora S.A.",
      cuit: "30711111119",
      email: "garantias@midistribuidora.com",
      telefono: "11 4444-5555",
      localidad: "CABA",
      provincia: "Buenos Aires",
    },
  });
  const norte = await db.distribuidor.create({
    data: {
      razonSocial: "Norte Partes SRL",
      cuit: "30722222228",
      email: "postventa@nortepartes.com",
      localidad: "San Miguel de Tucumán",
      provincia: "Tucumán",
    },
  });

  const mk = (nombre, email, rol, distribuidorId = null) =>
    db.usuario.create({ data: { nombre, email, rol, passwordHash: hash, distribuidorId } });

  const admin = await mk("Laura Méndez", "admin@driven.com.ar", "DRIVEN_ADMIN");
  const tecnico = await mk("Martín Sosa", "tecnico@driven.com.ar", "DRIVEN_TECNICO");
  const distAdmin = await mk("Facundo Pérez", "admin@midistribuidora.com", "DIST_ADMIN", miDist.id);
  const distOp = await mk("Carla Gómez", "ventas@midistribuidora.com", "DIST_OPERADOR", miDist.id);
  const norteAdmin = await mk("Jorge Ibáñez", "admin@nortepartes.com", "DIST_ADMIN", norte.id);

  const productos = {};
  for (const [codigo, nombre, categoria] of [
    ["CMP-150", "Compresor portátil 12V 150 PSI", "Compresores"],
    ["CMP-DIG", "Compresor digital 12V con corte automático", "Compresores"],
    ["CMP-4X4", "Compresor 4x4 doble pistón 12V", "Compresores"],
    ["CMP-INA", "Compresor inalámbrico recargable", "Compresores"],
    ["CRQ-4T", "Crique hidráulico tipo botella 4 tn", "4x4 y rescate"],
    ["CPT-600", "Cables puente 600A", "4x4 y rescate"],
    ["FLM-12V", "Calentador Flamate 12V", "Térmicos y calentadores"],
    ["TRM-13", "Termo acero 1.3 L", "Térmicos y calentadores"],
    ["ANF-MMX", "Anafe portátil Metalmax Flamate", "Aire libre"],
  ]) {
    productos[codigo] = await db.producto.create({ data: { codigo, nombre, categoria } });
  }

  async function garantia({ dist, creador, prod, datos, historial = [], mensajes = [], resolucionData = {} }) {
    const creadoEn = historial[0]?.fecha ?? new Date();
    const ultimo = historial.at(-1);
    const g = await db.garantia.create({
      data: {
        distribuidorId: dist.id,
        creadoPorId: creador.id,
        productoId: productos[prod].id,
        estado: ultimo?.estado ?? "CARGADA",
        creadoEn,
        ...datos,
        ...resolucionData,
      },
    });
    let anterior = null;
    for (const h of historial) {
      await db.evento.create({
        data: {
          garantiaId: g.id,
          usuarioId: h.usuario.id,
          estadoAnterior: anterior,
          estadoNuevo: h.estado,
          comentario: h.comentario ?? null,
          creadoEn: h.fecha,
        },
      });
      anterior = h.estado;
    }
    for (const m of mensajes) {
      await db.mensaje.create({ data: { garantiaId: g.id, autorId: m.autor.id, texto: m.texto, creadoEn: m.fecha } });
    }
    await adjuntarPdf(g.id, "FACTURA_COMPRA", `factura-${datos.numeroFactura ?? g.id}.pdf`, [
      "FACTURA (documento de demostracion)",
      `Cliente: ${datos.clienteNombre}`,
      `Producto: ${productos[prod].nombre}`,
      `Fecha: ${datos.fechaCompra.toLocaleDateString("es-AR")}`,
    ], creador.id, creadoEn);
    await db.garantia.update({ where: { id: g.id }, data: { actualizadoEn: ultimo?.fecha ?? creadoEn } });
    return g;
  }

  await garantia({
    dist: miDist,
    creador: distOp,
    prod: "CMP-150",
    datos: {
      numeroSerie: "DRV24A10233",
      fechaCompra: haceDias(120),
      numeroFactura: "B-0004-00018822",
      tipoFalla: "NO_INFLA",
      descripcionFalla: "El motor gira pero no levanta presión. El cliente lo usó para inflar cubiertas de camioneta.",
      clienteNombre: "Ricardo Fernández",
      clienteTelefono: "11 5566-7788",
    },
    historial: [{ estado: "CARGADA", usuario: distOp, fecha: haceDias(1, 9), comentario: "Garantía cargada por el distribuidor" }],
  });

  await garantia({
    dist: miDist,
    creador: distAdmin,
    prod: "CMP-DIG",
    datos: {
      numeroSerie: "DRV24D55120",
      fechaCompra: haceDias(200),
      numeroFactura: "A-0002-00004410",
      tipoFalla: "MANOMETRO",
      descripcionFalla: "El display marca presión errónea y corta antes de llegar a la presión configurada.",
      clienteNombre: "Gomería El Rápido",
      clienteDni: "20-28555444-1",
    },
    historial: [
      { estado: "CARGADA", usuario: distAdmin, fecha: haceDias(9), comentario: "Garantía cargada por el distribuidor" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(6), comentario: "Recibido en depósito con remito R-1123" },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(4), comentario: "En banco de pruebas" },
    ],
  });

  await garantia({
    dist: miDist,
    creador: distOp,
    prod: "CMP-4X4",
    datos: {
      fechaCompra: haceDias(400),
      tipoFalla: "SOBRECALENTAMIENTO",
      descripcionFalla: "Se apaga a los 5 minutos de uso por temperatura.",
      clienteNombre: "Lucas Benítez",
      clienteTelefono: "351 444-1212",
    },
    historial: [
      { estado: "CARGADA", usuario: distOp, fecha: haceDias(12), comentario: "Garantía cargada por el distribuidor" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(8) },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(7) },
      {
        estado: "INFO_REQUERIDA",
        usuario: tecnico,
        fecha: haceDias(3),
        comentario: "Necesitamos foto de la etiqueta con el número de serie, no vino en el equipo.",
      },
    ],
    mensajes: [
      { autor: tecnico, fecha: haceDias(3, 11), texto: "Hola Carla, el equipo llegó sin la etiqueta de serie. ¿Nos podés mandar una foto si el cliente la tiene en la caja?" },
    ],
  });

  const gNC = await garantia({
    dist: miDist,
    creador: distAdmin,
    prod: "CMP-150",
    datos: {
      numeroSerie: "DRV23K90012",
      fechaCompra: haceDias(300),
      numeroFactura: "A-0002-00003987",
      tipoFalla: "NO_ENCIENDE",
      descripcionFalla: "No enciende. Se probó con otra batería y tampoco.",
      clienteNombre: "Ana Torres",
      clienteEmail: "ana.torres@mail.com",
    },
    historial: [
      { estado: "CARGADA", usuario: distAdmin, fecha: haceDias(30), comentario: "Garantía cargada por el distribuidor" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(26) },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(25) },
      { estado: "APROBADA", usuario: tecnico, fecha: haceDias(22), comentario: "Falla de motor confirmada. Corresponde cambio." },
      { estado: "FINALIZADA", usuario: admin, fecha: haceDias(18), comentario: "Sin stock del modelo: se emitió nota de crédito." },
    ],
    mensajes: [
      { autor: distAdmin, fecha: haceDias(21), texto: "¿Para cuándo tendrían el cambio? El cliente está esperando." },
      { autor: admin, fecha: haceDias(19), texto: "No tenemos stock del modelo hasta el próximo embarque. Les emitimos nota de crédito, ya la pueden descargar." },
    ],
    resolucionData: {
      resolucion: "NOTA_CREDITO",
      motivoResolucion: "Sin stock para reemplazo",
      diagnostico: "Motor quemado. Falla de fabricación.",
      numeroNotaCredito: "NC-A-0001-00000457",
      montoNotaCredito: 89990,
    },
  });
  await adjuntarPdf(gNC.id, "NOTA_CREDITO", "NC-A-0001-00000457.pdf", [
    "NOTA DE CREDITO A-0001-00000457 (demo)",
    "Emisor: Driven",
    "Cliente: Mi Distribuidora S.A.",
    "Concepto: Garantia - Compresor portatil 12V 150 PSI",
    "Importe: $ 89.990,00",
  ], admin.id, haceDias(18));

  await garantia({
    dist: miDist,
    creador: distOp,
    prod: "FLM-12V",
    datos: {
      fechaCompra: haceDias(90),
      tipoFalla: "GOLPE_ROTURA",
      descripcionFalla: "Carcasa partida, no calienta.",
      clienteNombre: "Pedro Ruiz",
    },
    historial: [
      { estado: "CARGADA", usuario: distOp, fecha: haceDias(15), comentario: "Garantía cargada por el distribuidor" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(11) },
      { estado: "RECHAZADA", usuario: tecnico, fecha: haceDias(9), comentario: "Rotura por golpe externo, no cubierta por la garantía." },
    ],
    resolucionData: { diagnostico: "Carcasa con impacto visible. Resistencia dañada por el golpe." },
  });

  await garantia({
    dist: norte,
    creador: norteAdmin,
    prod: "CMP-INA",
    datos: {
      numeroSerie: "DRV24R00871",
      fechaCompra: haceDias(60),
      tipoFalla: "NO_ENCIENDE",
      descripcionFalla: "La batería no carga.",
      clienteNombre: "Sofía Medina",
    },
    historial: [
      { estado: "CARGADA", usuario: norteAdmin, fecha: haceDias(5), comentario: "Garantía cargada por el distribuidor" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(2) },
    ],
  });

  await garantia({
    dist: norte,
    creador: norteAdmin,
    prod: "CMP-150",
    datos: {
      numeroSerie: "DRV24A11002",
      fechaCompra: haceDias(150),
      tipoFalla: "PIERDE_AIRE",
      descripcionFalla: "Pierde aire por la manguera.",
      clienteNombre: "Transporte del Norte",
    },
    historial: [
      { estado: "CARGADA", usuario: norteAdmin, fecha: haceDias(14), comentario: "Garantía cargada por el distribuidor" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(10) },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(9) },
      { estado: "APROBADA", usuario: tecnico, fecha: haceDias(6), comentario: "Se cambia por unidad nueva, sale en el próximo envío." },
    ],
    resolucionData: { resolucion: "CAMBIO_PRODUCTO", diagnostico: "Acople de manguera defectuoso." },
  });

  console.log("✔ Datos de demostración cargados. Contraseña de todos los usuarios: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
