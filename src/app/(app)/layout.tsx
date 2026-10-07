import { requerirUsuario } from "@/lib/auth";
import { ROLES, esDriven, type Rol } from "@/lib/constantes";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { salir } from "@/app/login/acciones";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requerirUsuario();
  const driven = esDriven(usuario.rol);

  const links = [
    { href: "/panel", label: "Panel" },
    { href: "/garantias", label: driven ? "Garantías" : "Mis garantías" },
    ...(!driven ? [{ href: "/garantias/nueva", label: "+ Cargar garantía" }] : []),
    ...(usuario.rol === "DRIVEN_ADMIN"
      ? [
          { href: "/administracion/distribuidores", label: "Distribuidores" },
          { href: "/administracion/productos", label: "Productos" },
        ]
      : []),
    ...(usuario.rol === "DRIVEN_ADMIN" || usuario.rol === "DIST_ADMIN"
      ? [{ href: "/administracion/usuarios", label: driven ? "Usuarios" : "Mi equipo" }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col bg-tinta text-zinc-300 md:sticky md:top-0 md:h-screen md:w-60">
        <div className="border-b border-white/10 p-5">
          <Logo claro />
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 text-sm md:block">
          <div className="font-semibold text-white">{usuario.nombre}</div>
          <div className="text-xs text-zinc-400">{ROLES[usuario.rol as Rol]}</div>
          {usuario.distribuidor && <div className="mt-0.5 text-xs text-marca">{usuario.distribuidor.razonSocial}</div>}
          <form action={salir} className="mt-3">
            <button className="text-xs text-zinc-400 underline hover:text-white">Cerrar sesión</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
