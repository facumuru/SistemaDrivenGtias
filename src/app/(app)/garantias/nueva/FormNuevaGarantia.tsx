"use client";

import { useMemo, useState } from "react";
import { crearGarantia } from "../acciones";
import { useFormSinReset } from "@/lib/useFormSinReset";
import { TIPOS_FALLA, MAX_ARCHIVO_MB } from "@/lib/constantes";
import { Aviso } from "@/components/Aviso";
import { BotonEnviar } from "@/components/BotonEnviar";

type Producto = { id: string; codigo: string; nombre: string; categoria: string; garantiaMeses: number };

export function FormNuevaGarantia({ productos }: { productos: Producto[] }) {
  const { estado, onSubmit, pendiente } = useFormSinReset(crearGarantia);
  const [productoId, setProductoId] = useState("");
  const [fechaCompra, setFechaCompra] = useState("");

  const categorias = useMemo(() => {
    const m = new Map<string, Producto[]>();
    for (const p of productos) m.set(p.categoria, [...(m.get(p.categoria) ?? []), p]);
    return [...m.entries()];
  }, [productos]);

  const vigencia = useMemo(() => {
    const p = productos.find((x) => x.id === productoId);
    if (!p || !fechaCompra) return null;
    const vence = new Date(`${fechaCompra}T12:00:00`);
    vence.setMonth(vence.getMonth() + p.garantiaMeses);
    return { vence: vence.toLocaleDateString("es-AR"), vigente: vence.getTime() >= Date.now(), meses: p.garantiaMeses };
  }, [productos, productoId, fechaCompra]);

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <fieldset className="tarjeta space-y-4 p-5">
          <legend className="px-1 text-sm font-bold tracking-wide text-marca uppercase">1. Producto</legend>
          <div>
            <label className="etiqueta">Producto *</label>
            <select name="productoId" required className="campo" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
              <option value="">Seleccioná un producto…</option>
              {categorias.map(([cat, items]) => (
                <optgroup key={cat} label={cat}>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="etiqueta">N° de serie</label>
              <input name="numeroSerie" className="campo" placeholder="Ej: DRV2408123" />
            </div>
            <div>
              <label className="etiqueta">Lote</label>
              <input name="lote" className="campo" />
            </div>
            <div>
              <label className="etiqueta">Fecha de compra *</label>
              <input name="fechaCompra" type="date" required max={hoy} className="campo" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} />
            </div>
          </div>
          {vigencia && (
            <p className={`rounded-lg px-3 py-2 text-sm ${vigencia.vigente ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
              {vigencia.vigente
                ? `✔ Dentro de garantía (${vigencia.meses} meses). Vence el ${vigencia.vence}.`
                : `✖ Fuera de garantía: venció el ${vigencia.vence}. Podés cargarla igual y Driven la evaluará.`}
            </p>
          )}
        </fieldset>

        <fieldset className="tarjeta space-y-4 p-5">
          <legend className="px-1 text-sm font-bold tracking-wide text-marca uppercase">2. Falla</legend>
          <div>
            <label className="etiqueta">Tipo de falla *</label>
            <select name="tipoFalla" required className="campo" defaultValue="">
              <option value="" disabled>Seleccioná…</option>
              {Object.entries(TIPOS_FALLA).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta">Descripción de la falla *</label>
            <textarea
              name="descripcionFalla"
              required
              rows={4}
              className="campo"
              placeholder="¿Qué le pasa al producto? ¿Cuándo empezó? ¿Cómo lo usaba el cliente?"
            />
          </div>
        </fieldset>

        <fieldset className="tarjeta space-y-4 p-5">
          <legend className="px-1 text-sm font-bold tracking-wide text-marca uppercase">3. Cliente final</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="etiqueta">Nombre y apellido *</label>
              <input name="clienteNombre" required className="campo" />
            </div>
            <div>
              <label className="etiqueta">DNI / CUIT</label>
              <input name="clienteDni" className="campo" />
            </div>
            <div>
              <label className="etiqueta">Teléfono</label>
              <input name="clienteTelefono" className="campo" />
            </div>
            <div>
              <label className="etiqueta">Email</label>
              <input name="clienteEmail" type="email" className="campo" />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="space-y-6">
        <fieldset className="tarjeta space-y-4 p-5">
          <legend className="px-1 text-sm font-bold tracking-wide text-marca uppercase">4. Comprobantes</legend>
          <div>
            <label className="etiqueta">N° de factura</label>
            <input name="numeroFactura" className="campo" placeholder="Ej: A-0003-00012345" />
          </div>
          <div>
            <label className="etiqueta">Factura de compra * (PDF o foto)</label>
            <input name="factura" type="file" required accept="application/pdf,image/*" className="campo file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1" />
          </div>
          <div>
            <label className="etiqueta">Fotos o video del producto</label>
            <input name="fotos" type="file" multiple accept="image/*,video/mp4,video/quicktime" className="campo file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1" />
            <p className="mt-1 text-xs text-zinc-500">Hasta {MAX_ARCHIVO_MB} MB por archivo. Incluí una foto de la etiqueta con el n° de serie.</p>
          </div>
        </fieldset>

        <div className="tarjeta space-y-3 p-5">
          <Aviso estado={estado} />
          <BotonEnviar pendiente={pendiente} enviando="Enviando garantía..." className="btn-primario w-full py-3">
            Enviar garantía a Driven
          </BotonEnviar>
          <p className="text-center text-xs text-zinc-500">Vas a poder seguir el estado y chatear con Driven desde el detalle.</p>
        </div>
      </div>
    </form>
  );
}
