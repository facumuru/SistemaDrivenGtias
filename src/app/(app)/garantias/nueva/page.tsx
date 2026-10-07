import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requerirUsuario } from "@/lib/auth";
import { esDriven } from "@/lib/constantes";
import { AsistenteGarantia } from "./AsistenteGarantia";

export default async function NuevaGarantiaPage() {
  const usuario = await requerirUsuario();
  if (esDriven(usuario.rol) || !usuario.distribuidorId) redirect("/garantias");

  const [productos, sucursales] = await Promise.all([
    db.producto.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
      select: { id: true, codigo: true, nombre: true, categoria: true, garantiaMeses: true },
    }),
    usuario.sucursalId
      ? Promise.resolve([])
      : db.sucursal.findMany({
          where: { distribuidorId: usuario.distribuidorId, activa: true },
          orderBy: { nombre: "asc" },
          select: { id: true, nombre: true, localidad: true },
        }),
  ]);

  return (
    <AsistenteGarantia
      productos={productos}
      sucursales={sucursales}
      sucursalFija={usuario.sucursal?.nombre ?? null}
    />
  );
}
