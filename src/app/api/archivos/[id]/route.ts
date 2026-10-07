import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { garantiaVisible, usuarioActual } from "@/lib/auth";
import { CARPETA_UPLOADS } from "@/lib/archivos";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });

  const doc = await db.documento.findUnique({ where: { id: (await params).id } });
  if (!doc || !(await garantiaVisible(usuario, doc.garantiaId))) return new Response("No encontrado", { status: 404 });

  const ruta = path.resolve(CARPETA_UPLOADS, doc.ruta);
  if (!ruta.startsWith(CARPETA_UPLOADS + path.sep)) return new Response("No encontrado", { status: 404 });

  try {
    const contenido = await readFile(ruta);
    return new Response(contenido, {
      headers: {
        "Content-Type": doc.mime,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.nombreOriginal)}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Archivo no disponible", { status: 404 });
  }
}
