"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requerirDrivenAdmin, requerirUsuario } from "@/lib/auth";
import { ROLES } from "@/lib/constantes";
import type { EstadoForm } from "@/app/login/acciones";

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;

export async function crearDistribuidor(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  await requerirDrivenAdmin();
  const razonSocial = texto(form, "razonSocial");
  const cuit = texto(form, "cuit").replace(/\D/g, "");
  if (!razonSocial || cuit.length !== 11) return { error: "Razón social y CUIT (11 dígitos) son obligatorios." };
  if (await db.distribuidor.findUnique({ where: { cuit } })) return { error: "Ya existe un distribuidor con ese CUIT." };

  await db.distribuidor.create({
    data: {
      razonSocial,
      cuit,
      email: opcional(form, "email"),
      telefono: opcional(form, "telefono"),
      direccion: opcional(form, "direccion"),
      localidad: opcional(form, "localidad"),
      provincia: opcional(form, "provincia"),
    },
  });
  revalidatePath("/administracion/distribuidores");
  return { ok: `Distribuidor "${razonSocial}" creado. Ahora creale un usuario administrador.` };
}

export async function alternarDistribuidor(form: FormData) {
  await requerirDrivenAdmin();
  const id = texto(form, "id");
  const d = await db.distribuidor.findUnique({ where: { id } });
  if (d) await db.distribuidor.update({ where: { id }, data: { activo: !d.activo } });
  revalidatePath("/administracion/distribuidores");
}

export async function crearUsuario(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const actual = await requerirUsuario();
  const nombre = texto(form, "nombre");
  const email = texto(form, "email").toLowerCase();
  const password = texto(form, "password");
  let rol = texto(form, "rol");
  let distribuidorId = opcional(form, "distribuidorId");

  if (actual.rol === "DIST_ADMIN") {
    distribuidorId = actual.distribuidorId;
    if (rol !== "DIST_ADMIN" && rol !== "DIST_OPERADOR") rol = "DIST_OPERADOR";
  } else if (actual.rol !== "DRIVEN_ADMIN") {
    return { error: "No tenés permisos para crear usuarios." };
  }

  if (!nombre || !email || !password) return { error: "Nombre, email y contraseña son obligatorios." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (!(rol in ROLES)) return { error: "Rol inválido." };
  const esRolDist = rol.startsWith("DIST_");
  if (esRolDist && !distribuidorId) return { error: "Elegí el distribuidor del usuario." };
  if (await db.usuario.findUnique({ where: { email } })) return { error: "Ya existe un usuario con ese email." };

  await db.usuario.create({
    data: {
      nombre,
      email,
      rol,
      passwordHash: await bcrypt.hash(password, 10),
      distribuidorId: esRolDist ? distribuidorId : null,
    },
  });
  revalidatePath("/administracion/usuarios");
  return { ok: `Usuario ${email} creado.` };
}

export async function alternarUsuario(form: FormData) {
  const actual = await requerirUsuario();
  const id = texto(form, "id");
  if (id === actual.id) return;
  const u = await db.usuario.findUnique({ where: { id } });
  if (!u) return;
  const puede =
    actual.rol === "DRIVEN_ADMIN" || (actual.rol === "DIST_ADMIN" && u.distribuidorId === actual.distribuidorId);
  if (puede) await db.usuario.update({ where: { id }, data: { activo: !u.activo } });
  revalidatePath("/administracion/usuarios");
}

export async function crearProducto(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  await requerirDrivenAdmin();
  const codigo = texto(form, "codigo").toUpperCase();
  const nombre = texto(form, "nombre");
  const categoria = texto(form, "categoria");
  const meses = Number(texto(form, "garantiaMeses") || 24);
  if (!codigo || !nombre || !categoria) return { error: "Código, nombre y categoría son obligatorios." };
  if (!Number.isInteger(meses) || meses < 1) return { error: "Meses de garantía inválidos." };
  if (await db.producto.findUnique({ where: { codigo } })) return { error: "Ya existe un producto con ese código." };

  await db.producto.create({ data: { codigo, nombre, categoria, garantiaMeses: meses } });
  revalidatePath("/administracion/productos");
  return { ok: `Producto ${codigo} creado.` };
}

export async function alternarProducto(form: FormData) {
  await requerirDrivenAdmin();
  const id = texto(form, "id");
  const p = await db.producto.findUnique({ where: { id } });
  if (p) await db.producto.update({ where: { id }, data: { activo: !p.activo } });
  revalidatePath("/administracion/productos");
}
