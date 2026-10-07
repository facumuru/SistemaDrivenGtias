import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="text-4xl font-black text-tinta">404</h1>
        <p className="mt-2 text-zinc-500">No encontramos lo que buscabas o no tenés acceso.</p>
        <Link href="/panel" className="btn-primario mt-6">Volver al panel</Link>
      </div>
    </main>
  );
}
