"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const activo =
    pathname === href || (href !== "/garantias" && pathname.startsWith(href + "/")) ||
    (href === "/garantias" && /^\/garantias\/\d+/.test(pathname));
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
        activo ? "bg-marca text-white" : "hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
