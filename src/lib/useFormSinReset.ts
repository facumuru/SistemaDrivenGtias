"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { EstadoForm } from "@/app/login/acciones";

/** Como useActionState, pero sin que React vacíe el formulario cuando la acción devuelve un error. */
export function useFormSinReset(accion: (estado: EstadoForm, form: FormData) => Promise<EstadoForm>) {
  const [estado, despachar, pendiente] = useActionState(accion, undefined);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => despachar(datos));
  };
  return { estado, onSubmit, pendiente };
}
