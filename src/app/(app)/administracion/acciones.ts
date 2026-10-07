"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { puedeAdministrarEmpresa, requerirDrivenAdmin, requerirUsuario } from "@/lib/auth";
import { ROLES } from "@/lib/constantes";
import type { EstadoForm } from "@/app/login/acciones";

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;

export async function crearDistribuidor(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  await requerirDrivenAdmin();
  const razonSocial = texto(form, "razonSocial");
  const cuit = texto(form, "cuit").replace(/\D/g, "");
  const sucursal = texto(form, "sucursal") || "Casa central";
  if (!razonSocial || cuit.length !== 11) return { error: "Razón social y CUIT (11 dígitos) son obligatorios." };
  if (await db.distribuidor.findUnique({ where: { cuit } })) return { error: "Ya existe un distribuidor con ese CUIT." };

  const d = await db.distribuidor.create({
    data: {
      razonSocial,
      cuit,
      email: opcional(form, "email"),
      telefono: opcional(form, "telefono"),
      sucursales: { create: { nombre: sucursal, localidad: opcional(form, "localidad"), provincia: opcional(form, "provincia") } },
    },
  });
  revalidatePath("/administracion/distribuidores");
  redirect(`/administracion/distribuidores/${d.id}`);
}

export async function alternarDistribuidor(form: FormData) {
  await requerirDrivenAdmin();
  const id = texto(form, "id");
  const d = await db.distribuidor.findUnique({ where: { id } });
  if (d) await db.distribuidor.update({ where: { id }, data: { activo: !d.activo } });
  revalidatePath("/administracion/distribuidores", "layout");
}

export async function crearSucursal(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = await requerirUsuario();
  const distribuidorId = texto(form, "distribuidorId");
  if (!puedeAdministrarEmpresa(usuario, distribuidorId)) return { error: "No tenés permisos." };

  const nombre = texto(form, "nombre");
  if (!nombre) return { error: "Poné un nombre a la sucursal (ej: Mar del Plata)." };
  if (await db.sucursal.findFirst({ where: { distribuidorId, nombre } }))
    return { error: "Ya existe una sucursal con ese nombre." };

  await db.sucursal.create({
    data: {
      distribuidorId,
      nombre,
      direccion: opcional(form, "direccion"),
      localidad: opcional(form, "localidad"),
      provincia: opcional(form, "provincia"),
      telefono: opcional(form, "telefono"),
    },
  });
  revalidatePath("/", "layout");
  return { ok: `Sucursal "${nombre}" creada.` };
}

export async function alternarSucursal(form: FormData) {
  const usuario = await requerirUsuario();
  const s = await db.sucursal.findUnique({ where: { id: texto(form, "id") } });
  if (!s || !puedeAdministrarEmpresa(usuario, s.distribuidorId)) return;
  await db.sucursal.update({ where: { id: s.id }, data: { activa: !s.activa } });
  revalidatePath("/", "layout");
}

export async function crearUsuario(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const actual = await requerirUsuario();
  const nombre = texto(form, "nombre");
  const email = texto(form, "email").toLowerCase();
  const password = texto(form, "password");
  const rol = texto(form, "rol");
  const distribuidorId = opcional(form, "distribuidorId");
  const sucursalId = opcional(form, "sucursalId");

  if (!nombre || !email || !password) return { error: "Nombre, email y contraseña son obligatorios." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (!(rol in ROLES)) return { error: "Rol inválido." };
  if (await db.usuario.findUnique({ where: { email } })) return { error: "Ya existe un usuario con ese email." };

  const esRolDist = rol.startsWith("DIST_");
  if (esRolDist) {
    if (!distribuidorId || !puedeAdministrarEmpresa(actual, distribuidorId)) return { error: "No tenés permisos." };
    if (sucursalId && !(await db.sucursal.findFirst({ where: { id: sucursalId, distribuidorId } })))
      return { error: "Sucursal inválida." };
  } else if (actual.rol !== "DRIVEN_ADMIN") {
    return { error: "No tenés permisos." };
  }

  await db.usuario.create({
    data: {
      nombre,
      email,
      rol,
      passwordHash: await bcrypt.hash(password, 10),
      distribuidorId: esRolDist ? distribuidorId : null,
      sucursalId: esRolDist ? sucursalId : null,
    },
  });
  revalidatePath("/", "layout");
  return { ok: `Usuario ${email} creado. Pasale el email y la contraseña.` };
}

export async function alternarUsuario(form: FormData) {
  const actual = await requerirUsuario();
  const id = texto(form, "id");
  if (id === actual.id) return;
  const u = await db.usuario.findUnique({ where: { id } });
  if (!u) return;
  const puede = u.distribuidorId ? puedeAdministrarEmpresa(actual, u.distribuidorId) : actual.rol === "DRIVEN_ADMIN";
  if (puede) await db.usuario.update({ where: { id }, data: { activo: !u.activo } });
  revalidatePath("/", "layout");
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
