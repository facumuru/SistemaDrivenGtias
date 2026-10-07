import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requerirUsuario } from "@/lib/auth";
import { esDriven } from "@/lib/constantes";
import { Encabezado } from "@/components/Encabezado";
import { FormNuevaGarantia } from "./FormNuevaGarantia";

export default async function NuevaGarantiaPage() {
  const usuario = await requerirUsuario();
  if (esDriven(usuario.rol)) redirect("/garantias");

  const productos = await db.producto.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    select: { id: true, codigo: true, nombre: true, categoria: true, garantiaMeses: true },
  });

  return (
    <>
      <Encabezado
        titulo="Cargar garantía"
        subtitulo="Completá los datos del producto y del cliente. Driven te va a avisar cada cambio de estado."
      />
      <FormNuevaGarantia productos={productos} />
    </>
  );
}
