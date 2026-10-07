import { requerirUsuario } from "@/lib/auth";
import { esDriven } from "@/lib/constantes";
import { BandejaDriven } from "./BandejaDriven";
import { InicioDistribuidor } from "./InicioDistribuidor";

export default async function InicioPage() {
  const usuario = await requerirUsuario();
  return esDriven(usuario.rol) ? <BandejaDriven usuario={usuario} /> : <InicioDistribuidor usuario={usuario} />;
}
