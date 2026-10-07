import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { FormLogin } from "./FormLogin";

export default async function LoginPage() {
  if (await usuarioActual()) redirect("/panel");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-tinta p-12 text-white lg:flex">
        <Logo claro />
        <div>
          <h1 className="text-4xl font-black leading-tight">
            Portal de garantías
            <br />
            <span className="text-marca">para distribuidores</span>
          </h1>
          <p className="mt-4 max-w-md text-zinc-400">
            Cargá reclamos, seguí el estado en tiempo real, comunicate con el servicio técnico y descargá las notas de
            crédito, todo en un solo lugar.
          </p>
        </div>
        <p className="text-xs text-zinc-500">2 años de garantía oficial en todos los productos.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold">Ingresar</h2>
          <p className="mb-6 text-sm text-zinc-500">Usá el usuario que te asignó Driven.</p>
          <FormLogin />

          <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-4 text-xs text-zinc-500">
            <p className="mb-2 font-semibold text-zinc-700">Usuarios de demostración (contraseña: demo1234)</p>
            <ul className="space-y-1">
              <li><b>admin@driven.com.ar</b> · Administrador Driven</li>
              <li><b>tecnico@driven.com.ar</b> · Técnico Driven</li>
              <li><b>admin@midistribuidora.com</b> · Admin distribuidor</li>
              <li><b>ventas@midistribuidora.com</b> · Operador distribuidor</li>
              <li><b>admin@nortepartes.com</b> · Otro distribuidor</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
