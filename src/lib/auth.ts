import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
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
      include: { distribuidor: true },
    });
    if (!usuario || !usuario.activo) return null;
    if (usuario.distribuidor && !usuario.distribuidor.activo) return null;
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
  if (!esDriven(usuario.rol)) redirect("/garantias");
  return usuario;
}

export async function requerirDrivenAdmin() {
  const usuario = await requerirUsuario();
  if (usuario.rol !== "DRIVEN_ADMIN") redirect("/garantias");
  return usuario;
}

/** Filtro de Prisma que limita las garantías a las que el usuario puede ver. */
export function filtroGarantias(usuario: UsuarioSesion) {
  return esDriven(usuario.rol) ? {} : { distribuidorId: usuario.distribuidorId ?? "__ninguno__" };
}

export async function garantiaVisible(usuario: UsuarioSesion, id: number) {
  if (!Number.isInteger(id)) return null;
  return db.garantia.findFirst({ where: { id, ...filtroGarantias(usuario) } });
}
