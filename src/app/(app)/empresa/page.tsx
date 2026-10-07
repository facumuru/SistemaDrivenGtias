import { redirect } from "next/navigation";
import { puedeAdministrarEmpresa, requerirUsuario } from "@/lib/auth";
import { Encabezado } from "@/components/Encabezado";
import { GestionEmpresa } from "@/components/empresa/GestionEmpresa";

export default async function EmpresaPage() {
  const usuario = await requerirUsuario();
  if (!usuario.distribuidorId || !puedeAdministrarEmpresa(usuario, usuario.distribuidorId)) redirect("/inicio");

  return (
    <>
      <Encabezado titulo="Sucursales y usuarios" subtitulo={usuario.distribuidor?.razonSocial} />
      <GestionEmpresa distribuidorId={usuario.distribuidorId} usuarioActualId={usuario.id} />
    </>
  );
}
