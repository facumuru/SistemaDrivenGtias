"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cerrarSesion, crearSesion } from "@/lib/auth";

export type EstadoForm = { error?: string; ok?: string } | undefined;

export async function iniciarSesion(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Completá email y contraseña." };

  const usuario = await db.usuario.findUnique({ where: { email }, include: { distribuidor: true, sucursal: true } });
  const valido = usuario && (await bcrypt.compare(password, usuario.passwordHash));
  if (!usuario || !valido) return { error: "Email o contraseña incorrectos." };
  if (!usuario.activo || (usuario.distribuidor && !usuario.distribuidor.activo) || (usuario.sucursal && !usuario.sucursal.activa))
    return { error: "Tu usuario está deshabilitado. Contactá a Driven." };

  await crearSesion(usuario.id);
  redirect("/inicio");
}

export async function salir() {
  await cerrarSesion();
  redirect("/login");
}
