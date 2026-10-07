"use client";

import { useFormStatus } from "react-dom";

export function BotonEnviar({
  children,
  enviando = "Guardando...",
  className = "btn-primario",
  pendiente,
}: {
  children: React.ReactNode;
  enviando?: string;
  className?: string;
  pendiente?: boolean;
}) {
  const { pending } = useFormStatus();
  const ocupado = pendiente ?? pending;
  return (
    <button type="submit" disabled={ocupado} className={className}>
      {ocupado ? enviando : children}
    </button>
  );
}
