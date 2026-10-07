"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: number }) {
  const pathname = usePathname();
  const activo =
    href === "/garantias"
      ? pathname === "/garantias" || /^\/garantias\/\d+/.test(pathname)
      : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
        activo ? "bg-tinta text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-tinta"
      }`}
    >
      {children}
      {!!badge && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-marca px-1.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
