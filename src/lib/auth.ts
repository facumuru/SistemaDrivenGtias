import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { esDriven } from "./constantes";

const COOKIE = "sesion";
const DURACION_SEG = 60 * 60 * 12;

const clave = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");

export async function crearSesion(usuarioId: string) {
  const token = await new SignJWT({ sub: usuarioId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SEG}s`)
    .sign(clave());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEG,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function usuarioActual() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave());
    if (!payload.sub) return null;
    const usuario = await db.usuario.findUnique({
      where: { id: payload.sub },
      include: { distribuidor: true, sucursal: true },
    });
    if (!usuario || !usuario.activo) return null;
    if (usuario.distribuidor && !usuario.distribuidor.activo) return null;
    if (usuario.sucursal && !usuario.sucursal.activa) return null;
    return usuario;
  } catch {
    return null;
  }
}

export type UsuarioSesion = NonNullable<Awaited<ReturnType<typeof usuarioActual>>>;

export async function requerirUsuario() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

export async function requerirDriven() {
  const usuario = await requerirUsuario();
  if (!esDriven(usuario.rol)) redirect("/inicio");
  return usuario;
}

export async function requerirDrivenAdmin() {
  const usuario = await requerirUsuario();
  if (usuario.rol !== "DRIVEN_ADMIN") redirect("/inicio");
  return usuario;
}

/** Garantías que el usuario puede ver: Driven todas, distribuidor las de su empresa o solo las de su sucursal. */
export function filtroGarantias(usuario: UsuarioSesion): Prisma.GarantiaWhereInput {
  if (esDriven(usuario.rol)) return {};
  return {
    distribuidorId: usuario.distribuidorId ?? "__ninguno__",
    ...(usuario.sucursalId ? { sucursalId: usuario.sucursalId } : {}),
  };
}

export async function garantiaVisible(usuario: UsuarioSesion, id: number) {
  if (!Number.isInteger(id)) return null;
  return db.garantia.findFirst({ where: { id, ...filtroGarantias(usuario) } });
}

/** Puede administrar sucursales y usuarios de esa empresa. */
export function puedeAdministrarEmpresa(usuario: UsuarioSesion, distribuidorId: string) {
  return (
    usuario.rol === "DRIVEN_ADMIN" ||
    (usuario.rol === "DIST_ADMIN" && !usuario.sucursalId && usuario.distribuidorId === distribuidorId)
  );
}
