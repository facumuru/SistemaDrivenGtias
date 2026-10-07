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
    data: { garantiaId, tipo, nombreOriginal: nombre, ruta: path.join(String(garantiaId), archivo), mime: "application/pdf", tamano: buffer.length, subidoPorId, creadoEn },
  });
}

async function main() {
  await db.vista.deleteMany();
  await db.documento.deleteMany();
  await db.mensaje.deleteMany();
  await db.evento.deleteMany();
  await db.garantia.deleteMany();
  await db.usuario.deleteMany();
  await db.sucursal.deleteMany();
  await db.producto.deleteMany();
  await db.distribuidor.deleteMany();
  await rm(UPLOADS, { recursive: true, force: true });

  const hash = await bcrypt.hash("demo1234", 10);

  const iturria = await db.distribuidor.create({
    data: { razonSocial: "ITURRIA S.A.", cuit: "30711111119", email: "garantias@iturria.com.ar", telefono: "0223 400-1000" },
  });
  const mdp = await db.sucursal.create({
    data: { distribuidorId: iturria.id, nombre: "Mar del Plata", direccion: "Av. Juan B. Justo 4500", localidad: "Mar del Plata", provincia: "Buenos Aires", telefono: "0223 400-1000" },
  });
  const bsas = await db.sucursal.create({
    data: { distribuidorId: iturria.id, nombre: "Buenos Aires", direccion: "Av. Warnes 1800", localidad: "CABA", provincia: "Buenos Aires", telefono: "011 4555-2000" },
  });
  const bahia = await db.sucursal.create({
    data: { distribuidorId: iturria.id, nombre: "Bahía Blanca", direccion: "Av. Colón 950", localidad: "Bahía Blanca", provincia: "Buenos Aires", telefono: "0291 455-3000" },
  });

  const norte = await db.distribuidor.create({
    data: { razonSocial: "Norte Partes SRL", cuit: "30722222228", email: "postventa@nortepartes.com" },
  });
  const tucuman = await db.sucursal.create({
    data: { distribuidorId: norte.id, nombre: "Tucumán", localidad: "San Miguel de Tucumán", provincia: "Tucumán" },
  });

  const mk = (nombre, email, rol, distribuidorId = null, sucursalId = null) =>
    db.usuario.create({ data: { nombre, email, rol, passwordHash: hash, distribuidorId, sucursalId } });

  const admin = await mk("Laura Méndez", "admin@driven.com.ar", "DRIVEN_ADMIN");
  const tecnico = await mk("Martín Sosa", "tecnico@driven.com.ar", "DRIVEN_TECNICO");
  const gerente = await mk("Facundo Pérez", "admin@iturria.com.ar", "DIST_ADMIN", iturria.id);
  const opMdp = await mk("Carla Gómez", "mdp@iturria.com.ar", "DIST_OPERADOR", iturria.id, mdp.id);
  const opBsas = await mk("Diego Ramos", "bsas@iturria.com.ar", "DIST_OPERADOR", iturria.id, bsas.id);
  const opBahia = await mk("Lucía Fernández", "bahia@iturria.com.ar", "DIST_OPERADOR", iturria.id, bahia.id);
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

  const drivenUsers = [admin, tecnico];
  const usuariosDe = (dist) => (dist.id === iturria.id ? [gerente, opMdp, opBsas, opBahia] : [norteAdmin]);

  async function garantia({ suc, dist, creador, prod, datos, historial = [], mensajes = [], extra = {}, novedadDist = false, novedadDriven = false }) {
    const creadoEn = historial[0].fecha;
    const ultimo = historial.at(-1);
    const deDriven = [...historial.filter((h) => drivenUsers.includes(h.usuario)), ...mensajes.filter((m) => drivenUsers.includes(m.autor))]
      .map((x) => x.fecha)
      .sort((a, b) => b - a)[0];
    const deDist = [...historial.filter((h) => !drivenUsers.includes(h.usuario)), ...mensajes.filter((m) => !drivenUsers.includes(m.autor))]
      .map((x) => x.fecha)
      .sort((a, b) => b - a)[0];

    const g = await db.garantia.create({
      data: {
        distribuidorId: dist.id,
        sucursalId: suc.id,
        creadoPorId: creador.id,
        productoId: productos[prod].id,
        estado: ultimo.estado,
        creadoEn,
        actividadDrivenEn: deDriven ?? null,
        actividadDistEn: deDist ?? null,
        ...datos,
        ...extra,
      },
    });
    let anterior = null;
    for (const h of historial) {
      await db.evento.create({
        data: { garantiaId: g.id, usuarioId: h.usuario.id, estadoAnterior: anterior, estadoNuevo: h.estado, comentario: h.comentario ?? null, creadoEn: h.fecha },
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

    const vistoEn = new Date();
    const lectores = [...(novedadDist ? [] : usuariosDe(dist)), ...(novedadDriven ? [] : drivenUsers)];
    for (const u of lectores) await db.vista.create({ data: { usuarioId: u.id, garantiaId: g.id, vistoEn } });
    await db.garantia.update({ where: { id: g.id }, data: { actualizadoEn: ultimo.fecha } });
    return g;
  }

  const I = { dist: iturria };

  await garantia({
    ...I, suc: mdp, creador: opMdp, prod: "CMP-150", novedadDriven: true,
    datos: { numeroSerie: "DRV24A10233", fechaCompra: haceDias(120), numeroFactura: "B-0004-00018822", tipoFalla: "NO_INFLA", descripcionFalla: "El motor gira pero no levanta presión. El cliente lo usó para inflar cubiertas de camioneta.", clienteNombre: "Ricardo Fernández", clienteTelefono: "223 556-7788" },
    historial: [{ estado: "CARGADA", usuario: opMdp, fecha: haceDias(1, 9), comentario: "Cargada por Mar del Plata" }],
  });

  await garantia({
    ...I, suc: bsas, creador: opBsas, prod: "CMP-DIG",
    datos: { numeroSerie: "DRV24D55120", fechaCompra: haceDias(200), numeroFactura: "A-0002-00004410", tipoFalla: "MANOMETRO", descripcionFalla: "El display marca presión errónea y corta antes de llegar a la presión configurada.", clienteNombre: "Gomería El Rápido", clienteDni: "20-28555444-1" },
    historial: [
      { estado: "CARGADA", usuario: opBsas, fecha: haceDias(9), comentario: "Cargada por Buenos Aires" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(6), comentario: "Recibido en depósito con remito R-1123" },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(4), comentario: "En banco de pruebas" },
    ],
  });

  await garantia({
    ...I, suc: mdp, creador: opMdp, prod: "CMP-4X4", novedadDist: true,
    datos: { fechaCompra: haceDias(400), tipoFalla: "SOBRECALENTAMIENTO", descripcionFalla: "Se apaga a los 5 minutos de uso por temperatura.", clienteNombre: "Lucas Benítez", clienteTelefono: "223 444-1212" },
    historial: [
      { estado: "CARGADA", usuario: opMdp, fecha: haceDias(12), comentario: "Cargada por Mar del Plata" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(8) },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(7) },
      { estado: "INFO_REQUERIDA", usuario: tecnico, fecha: haceDias(2), comentario: "El equipo llegó sin la etiqueta de serie. ¿Nos pueden mandar una foto de la caja original donde figure el número?" },
    ],
  });

  const gNC = await garantia({
    ...I, suc: bahia, creador: opBahia, prod: "CMP-150",
    datos: { numeroSerie: "DRV23K90012", fechaCompra: haceDias(300), numeroFactura: "A-0002-00003987", tipoFalla: "NO_ENCIENDE", descripcionFalla: "No enciende. Se probó con otra batería y tampoco.", clienteNombre: "Ana Torres", clienteEmail: "ana.torres@mail.com" },
    historial: [
      { estado: "CARGADA", usuario: opBahia, fecha: haceDias(30), comentario: "Cargada por Bahía Blanca" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(26) },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(25) },
      { estado: "APROBADA", usuario: tecnico, fecha: haceDias(22), comentario: "Falla de motor confirmada. Corresponde cambio." },
      { estado: "FINALIZADA", usuario: admin, fecha: haceDias(18), comentario: "Sin stock del modelo: se emitió nota de crédito." },
    ],
    mensajes: [
      { autor: opBahia, fecha: haceDias(21), texto: "¿Para cuándo tendrían el cambio? El cliente está esperando." },
      { autor: admin, fecha: haceDias(19), texto: "No tenemos stock del modelo hasta el próximo embarque. Les emitimos nota de crédito, ya la pueden descargar." },
    ],
    extra: { resolucion: "NOTA_CREDITO", motivoResolucion: "Sin stock para reemplazo", diagnostico: "Motor quemado. Falla de fabricación.", numeroNotaCredito: "NC-A-0001-00000457", montoNotaCredito: 89990 },
  });
  await adjuntarPdf(gNC.id, "NOTA_CREDITO", "NC-A-0001-00000457.pdf", [
    "NOTA DE CREDITO A-0001-00000457 (demo)",
    "Emisor: Driven",
    "Cliente: ITURRIA S.A. - Sucursal Bahia Blanca",
    "Concepto: Garantia - Compresor portatil 12V 150 PSI",
    "Importe: $ 89.990,00",
  ], admin.id, haceDias(18));

  await garantia({
    ...I, suc: mdp, creador: opMdp, prod: "FLM-12V",
    datos: { fechaCompra: haceDias(90), tipoFalla: "GOLPE_ROTURA", descripcionFalla: "Carcasa partida, no calienta.", clienteNombre: "Pedro Ruiz" },
    historial: [
      { estado: "CARGADA", usuario: opMdp, fecha: haceDias(15), comentario: "Cargada por Mar del Plata" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(11) },
      { estado: "RECHAZADA", usuario: tecnico, fecha: haceDias(9), comentario: "Rotura por golpe externo, no cubierta por la garantía." },
    ],
    extra: { diagnostico: "Carcasa con impacto visible. Resistencia dañada por el golpe." },
  });

  await garantia({
    ...I, suc: bahia, creador: opBahia, prod: "CMP-INA",
    datos: { numeroSerie: "DRV24R00871", fechaCompra: haceDias(60), tipoFalla: "NO_ENCIENDE", descripcionFalla: "La batería no carga, la luz del cargador queda titilando.", clienteNombre: "Sofía Medina" },
    historial: [
      { estado: "CARGADA", usuario: opBahia, fecha: haceDias(5), comentario: "Cargada por Bahía Blanca" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(2) },
    ],
  });

  await garantia({
    ...I, suc: bsas, creador: opBsas, prod: "CMP-150", novedadDist: true,
    datos: { numeroSerie: "DRV24A11002", fechaCompra: haceDias(150), tipoFalla: "PIERDE_AIRE", descripcionFalla: "Pierde aire por el acople de la manguera.", clienteNombre: "Transportes Del Sur" },
    historial: [
      { estado: "CARGADA", usuario: opBsas, fecha: haceDias(14), comentario: "Cargada por Buenos Aires" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(10) },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(9) },
      { estado: "APROBADA", usuario: tecnico, fecha: haceDias(1), comentario: "Se cambia por unidad nueva, sale en el próximo envío a la sucursal." },
    ],
    extra: { resolucion: "CAMBIO_PRODUCTO", diagnostico: "Acople de manguera defectuoso." },
  });

  await garantia({
    ...I, suc: bahia, creador: opBahia, prod: "CRQ-4T",
    datos: { numeroSerie: "CRQ23-5531", fechaCompra: haceDias(250), numeroFactura: "B-0007-00001210", tipoFalla: "PIERDE_AIRE", descripcionFalla: "Pierde aceite y no sostiene el peso.", clienteNombre: "Taller Los Andes" },
    historial: [
      { estado: "CARGADA", usuario: opBahia, fecha: haceDias(40), comentario: "Cargada por Bahía Blanca" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(35) },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(34) },
      { estado: "APROBADA", usuario: tecnico, fecha: haceDias(30), comentario: "Se cambian retenes." },
      { estado: "FINALIZADA", usuario: tecnico, fecha: haceDias(25), comentario: "Reparado y enviado a la sucursal." },
    ],
    extra: { resolucion: "REPARACION", diagnostico: "Retenes gastados. Se reemplazaron y se probó con carga.", remitoEnvio: "R-0001-00004567 · Andreani 360000123" },
  });

  await garantia({
    ...I, suc: bsas, creador: opBsas, prod: "TRM-13", novedadDriven: true,
    datos: { fechaCompra: haceDias(45), numeroFactura: "B-0004-00019120", tipoFalla: "OTRO", descripcionFalla: "No conserva la temperatura, a las 2 horas el agua está fría.", clienteNombre: "Mariana Soto", clienteTelefono: "11 6000-1234" },
    historial: [{ estado: "CARGADA", usuario: opBsas, fecha: haceDias(0, 8), comentario: "Cargada por Buenos Aires" }],
  });

  await garantia({
    dist: norte, suc: tucuman, creador: norteAdmin, prod: "CMP-INA",
    datos: { numeroSerie: "DRV24R00999", fechaCompra: haceDias(70), tipoFalla: "RUIDO", descripcionFalla: "Hace un ruido metálico fuerte al encender.", clienteNombre: "Raúl Medina" },
    historial: [{ estado: "CARGADA", usuario: norteAdmin, fecha: haceDias(10), comentario: "Cargada por Tucumán" }],
  });

  await garantia({
    dist: norte, suc: tucuman, creador: norteAdmin, prod: "CMP-150",
    datos: { numeroSerie: "DRV24A13300", fechaCompra: haceDias(100), tipoFalla: "NO_INFLA", descripcionFalla: "No supera los 30 PSI.", clienteNombre: "Transporte del Norte" },
    historial: [
      { estado: "CARGADA", usuario: norteAdmin, fecha: haceDias(8), comentario: "Cargada por Tucumán" },
      { estado: "EQUIPO_RECIBIDO", usuario: tecnico, fecha: haceDias(5) },
      { estado: "EN_REVISION", usuario: tecnico, fecha: haceDias(3) },
    ],
  });

  console.log("✔ Datos de demostración cargados. Contraseña de todos los usuarios: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
