import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NoEncontrado() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <div className="mb-8 flex justify-center">
          <Logo alto={36} />
        </div>
        <h1 className="text-5xl font-black">404</h1>
        <p className="mt-2 text-zinc-500">No encontramos lo que buscabas, o no tenés acceso.</p>
        <Link href="/inicio" className="btn-primario mt-6">Volver al inicio</Link>
      </div>
    </main>
  );
}
