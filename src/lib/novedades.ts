import "server-only";
import { db } from "./db";
import { esDriven } from "./constantes";
import { filtroGarantias, type UsuarioSesion } from "./auth";

type ConActividad = {
  actividadDrivenEn: Date | null;
  actividadDistEn: Date | null;
  vistas: { vistoEn: Date }[];
};

export const incluirVista = (usuarioId: string) => ({
  vistas: { where: { usuarioId }, select: { vistoEn: true } },
});

/** Hay novedad si la otra parte hizo algo después de la última vez que el usuario abrió la garantía. */
export function tieneNovedad(usuario: UsuarioSesion, g: ConActividad) {
  const otra = esDriven(usuario.rol) ? g.actividadDistEn : g.actividadDrivenEn;
  if (!otra) return false;
  const visto = g.vistas[0]?.vistoEn;
  return !visto || otra > visto;
}

export async function contarNovedades(usuario: UsuarioSesion) {
  const campo = esDriven(usuario.rol) ? "actividadDistEn" : "actividadDrivenEn";
  const garantias = await db.garantia.findMany({
    where: { ...filtroGarantias(usuario), [campo]: { not: null } },
    select: { actividadDrivenEn: true, actividadDistEn: true, ...incluirVista(usuario.id) },
  });
  return garantias.filter((g) => tieneNovedad(usuario, g)).length;
}

export async function marcarVista(usuarioId: string, garantiaId: number) {
  await db.vista.upsert({
    where: { usuarioId_garantiaId: { usuarioId, garantiaId } },
    create: { usuarioId, garantiaId },
    update: { vistoEn: new Date() },
  });
}

export const campoActividad = (rol: string) => (esDriven(rol) ? "actividadDrivenEn" : "actividadDistEn");
