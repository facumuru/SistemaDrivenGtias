import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { FormLogin } from "./FormLogin";

export default async function LoginPage() {
  if (await usuarioActual()) redirect("/inicio");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-tinta p-12 text-white lg:flex">
        <div className="absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full border-[56px] border-white/5" />
        <Logo claro alto={40} />
        <div className="relative">
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-marca uppercase">Portal de garantías</p>
          <h1 className="text-5xl leading-tight font-black">
            Garantías simples,
            <br />
            sin papeles ni mails.
          </h1>
          <ul className="mt-8 space-y-3 text-zinc-300">
            <li>✓ Cargá un reclamo en pocos pasos</li>
            <li>✓ Seguí el estado en tiempo real</li>
            <li>✓ Hablá con el servicio técnico en el mismo lugar</li>
            <li>✓ Descargá notas de crédito y comprobantes</li>
          </ul>
        </div>
        <p className="relative text-xs text-zinc-500">2 años de garantía oficial en todos los productos Driven.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo alto={34} />
          </div>
          <h2 className="text-3xl font-black">Ingresar</h2>
          <p className="mt-1 mb-8 text-sm text-zinc-500">Usá el email y la contraseña que te dio Driven.</p>
          <FormLogin />
        </div>
      </section>
    </main>
  );
}
