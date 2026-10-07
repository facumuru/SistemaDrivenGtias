import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { ROLES, esDriven, type Rol } from "@/lib/constantes";
import { contarNovedades } from "@/lib/novedades";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { salir } from "@/app/login/acciones";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requerirUsuario();
  const driven = esDriven(usuario.rol);
  const novedades = await contarNovedades(usuario);
  const adminEmpresa = usuario.rol === "DIST_ADMIN" && !usuario.sucursalId;

  const links = driven
    ? [
        { href: "/inicio", label: "Bandeja de trabajo" },
        { href: "/garantias", label: "Todas las garantías", badge: novedades },
        ...(usuario.rol === "DRIVEN_ADMIN"
          ? [
              { href: "/administracion/distribuidores", label: "Distribuidores" },
              { href: "/administracion/productos", label: "Productos" },
              { href: "/administracion/usuarios", label: "Equipo Driven" },
            ]
          : []),
      ]
    : [
        { href: "/inicio", label: "Inicio" },
        { href: "/garantias", label: "Mis garantías", badge: novedades },
        ...(adminEmpresa ? [{ href: "/empresa", label: "Sucursales y usuarios" }] : []),
      ];

  const ubicacion = driven
    ? "Driven"
    : `${usuario.distribuidor?.razonSocial}${usuario.sucursal ? ` · ${usuario.sucursal.nombre}` : " · Todas las sucursales"}`;

  return (
    <div className="min-h-screen">
      <header className="no-imprimir sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          <Link href="/inicio" className="flex shrink-0 items-center gap-3">
            <Logo alto={26} />
            <span className="hidden border-l border-zinc-300 pl-3 text-xs font-semibold tracking-[0.15em] text-zinc-500 uppercase sm:block">
              Garantías
            </span>
          </Link>
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} badge={l.badge}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {!driven && (
              <Link href="/garantias/nueva" className="btn-marca hidden sm:inline-flex">
                + Nueva garantía
              </Link>
            )}
            <div className="hidden text-right leading-tight md:block">
              <div className="text-sm font-semibold">{usuario.nombre}</div>
              <div className="text-xs text-zinc-500">
                {ROLES[usuario.rol as Rol]} · {ubicacion}
              </div>
            </div>
            <form action={salir}>
              <button className="btn-secundario px-3 py-2 text-xs" title="Cerrar sesión">
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-3 py-2 lg:hidden">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} badge={l.badge}>
              {l.label}
            </NavLink>
          ))}
          {!driven && <NavLink href="/garantias/nueva">+ Nueva</NavLink>}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
