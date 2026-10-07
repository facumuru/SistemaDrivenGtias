import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MAX_ARCHIVO_MB } from "./constantes";

export const CARPETA_UPLOADS = path.join(process.cwd(), "uploads");

const MIME_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
];

export function validarArchivo(archivo: File): string | null {
  if (archivo.size > MAX_ARCHIVO_MB * 1024 * 1024)
    return `"${archivo.name}" supera los ${MAX_ARCHIVO_MB} MB.`;
  if (!MIME_PERMITIDOS.includes(archivo.type))
    return `"${archivo.name}" no es un formato permitido (fotos, PDF o videos MP4/MOV).`;
  return null;
}

export function archivosDelForm(form: FormData, campo: string) {
  return form.getAll(campo).filter((v): v is File => v instanceof File && v.size > 0);
}

export async function guardarArchivo(garantiaId: number, archivo: File) {
  const carpeta = path.join(CARPETA_UPLOADS, String(garantiaId));
  await mkdir(carpeta, { recursive: true });
  const ext = path.extname(archivo.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const nombre = `${randomUUID()}${ext}`;
  await writeFile(path.join(carpeta, nombre), Buffer.from(await archivo.arrayBuffer()));
  return {
    ruta: path.join(String(garantiaId), nombre),
    nombreOriginal: archivo.name,
    mime: archivo.type,
    tamano: archivo.size,
  };
}
