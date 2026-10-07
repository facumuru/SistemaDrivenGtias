import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";

export default async function Inicio() {
  const usuario = await usuarioActual();
  redirect(usuario ? "/inicio" : "/login");
}
