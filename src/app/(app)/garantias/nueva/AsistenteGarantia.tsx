"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { crearGarantia } from "../acciones";
import { MAX_ARCHIVO_MB, TIPOS_FALLA } from "@/lib/constantes";
import { Aviso } from "@/components/Aviso";
import { ZonaArchivos } from "@/components/ZonaArchivos";

type Producto = { id: string; codigo: string; nombre: string; categoria: string; garantiaMeses: number };
type Sucursal = { id: string; nombre: string; localidad: string | null };
type Paso = "sucursal" | "producto" | "falla" | "cliente" | "archivos" | "revisar";

const TITULOS: Record<Paso, { titulo: string; ayuda: string }> = {
  sucursal: { titulo: "¿Desde qué sucursal?", ayuda: "La garantía va a quedar asignada a esa sucursal." },
  producto: { titulo: "¿Qué producto falló?", ayuda: "Elegí el producto y completá los datos de la compra." },
  falla: { titulo: "¿Qué le pasa?", ayuda: "Elegí el problema y contalo con tus palabras." },
  cliente: { titulo: "¿Quién es el cliente?", ayuda: "Los datos del cliente final, por si Driven necesita contactarlo." },
  archivos: { titulo: "Comprobantes", ayuda: "La factura es obligatoria. Las fotos ayudan a resolver más rápido." },
  revisar: { titulo: "Revisá y enviá", ayuda: "Chequeá que esté todo bien antes de enviarla a Driven." },
};

const hoy = () => new Date().toISOString().slice(0, 10);

export function AsistenteGarantia({
  productos,
  sucursales,
  sucursalFija,
}: {
  productos: Producto[];
  sucursales: Sucursal[];
  sucursalFija: string | null;
}) {
  const pasos: Paso[] = [...(sucursales.length > 1 ? (["sucursal"] as Paso[]) : []), "producto", "falla", "cliente", "archivos", "revisar"];
  const [indice, setIndice] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [estado, despachar, enviando] = useActionState(crearGarantia, undefined);

  const [sucursalId, setSucursalId] = useState(sucursales.length === 1 ? sucursales[0].id : "");
  const [busqueda, setBusqueda] = useState("");
  const [d, setD] = useState({
    productoId: "",
    numeroSerie: "",
    fechaCompra: "",
    numeroFactura: "",
    tipoFalla: "",
    descripcionFalla: "",
    clienteNombre: "",
    clienteDni: "",
    clienteTelefono: "",
    clienteEmail: "",
  });
  const [factura, setFactura] = useState<File[]>([]);
  const [fotos, setFotos] = useState<File[]>([]);
  const set = (campo: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((x) => ({ ...x, [campo]: e.target.value }));

  const paso = pasos[indice];
  const producto = productos.find((p) => p.id === d.productoId);
  const sucursal = sucursales.find((s) => s.id === sucursalId);

  const filtrados = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    const lista = t ? productos.filter((p) => `${p.nombre} ${p.codigo} ${p.categoria}`.toLowerCase().includes(t)) : productos;
    const m = new Map<string, Producto[]>();
    for (const p of lista) m.set(p.categoria, [...(m.get(p.categoria) ?? []), p]);
    return [...m.entries()];
  }, [productos, busqueda]);

  const vigencia = useMemo(() => {
    if (!producto || !d.fechaCompra) return null;
    const vence = new Date(`${d.fechaCompra}T12:00:00`);
    vence.setMonth(vence.getMonth() + producto.garantiaMeses);
    return { vence: vence.toLocaleDateString("es-AR"), vigente: vence.getTime() >= Date.now() };
  }, [producto, d.fechaCompra]);

  function validar(p: Paso): string | null {
    if (p === "sucursal" && !sucursalId) return "Elegí una sucursal.";
    if (p === "producto") {
      if (!d.productoId) return "Elegí el producto.";
      if (!d.fechaCompra) return "Indicá la fecha de compra.";
      if (d.fechaCompra > hoy()) return "La fecha de compra no puede ser futura.";
    }
    if (p === "falla") {
      if (!d.tipoFalla) return "Elegí qué problema tiene.";
      if (d.descripcionFalla.trim().length < 10) return "Contá un poco más sobre la falla (mínimo 10 caracteres).";
    }
    if (p === "cliente" && !d.clienteNombre.trim()) return "Poné el nombre del cliente.";
    if (p === "archivos") {
      if (factura.length === 0) return "Adjuntá la factura de compra.";
      if ([...factura, ...fotos].some((a) => a.size > MAX_ARCHIVO_MB * 1024 * 1024)) return `Hay archivos de más de ${MAX_ARCHIVO_MB} MB.`;
    }
    return null;
  }

  const siguiente = () => {
    const e = validar(paso);
    setError(e);
    if (!e) {
      setIndice((i) => Math.min(i + 1, pasos.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const atras = () => {
    setError(null);
    setIndice((i) => Math.max(0, i - 1));
  };
  const irA = (p: Paso) => setIndice(pasos.indexOf(p));

  const enviar = () => {
    const fd = new FormData();
    Object.entries(d).forEach(([k, v]) => fd.append(k, v));
    if (sucursalId) fd.append("sucursalId", sucursalId);
    factura.forEach((f) => fd.append("factura", f));
    fotos.forEach((f) => fd.append("fotos", f));
    startTransition(() => despachar(fd));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/garantias" className="text-sm text-zinc-500 hover:text-tinta">← Cancelar</Link>
        <span className="text-sm text-zinc-500">
          {sucursalFija ? `Sucursal ${sucursalFija}` : sucursal ? `Sucursal ${sucursal.nombre}` : ""}
        </span>
      </div>

      <ol className="mb-8 flex gap-2">
        {pasos.map((p, i) => (
          <li key={p} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= indice ? "bg-tinta" : "bg-zinc-200"}`} />
            <div className={`mt-2 hidden text-xs font-medium sm:block ${i === indice ? "text-tinta" : "text-zinc-400"}`}>
              {i + 1}. {TITULOS[p].titulo.replace("¿", "").replace("?", "")}
            </div>
          </li>
        ))}
      </ol>

      <div className="tarjeta p-6 md:p-8">
        <p className="titulo-seccion">Paso {indice + 1} de {pasos.length}</p>
        <h1 className="mt-1 text-2xl font-black">{TITULOS[paso].titulo}</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500">{TITULOS[paso].ayuda}</p>

        {paso === "sucursal" && (
          <div className="grid gap-3 sm:grid-cols-3">
            {sucursales.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSucursalId(s.id)}
                className={`cursor-pointer rounded-2xl border-2 p-5 text-left transition ${
                  sucursalId === s.id ? "border-tinta bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <div className="text-2xl">🏬</div>
                <div className="mt-2 font-bold">{s.nombre}</div>
                {s.localidad && <div className="text-xs text-zinc-500">{s.localidad}</div>}
              </button>
            ))}
          </div>
        )}

        {paso === "producto" && (
          <div className="space-y-6">
            <div>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="🔍  Buscar producto por nombre o código"
                className="campo"
              />
              <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
                {filtrados.length === 0 && <p className="py-4 text-center text-sm text-zinc-500">No encontramos ese producto.</p>}
                {filtrados.map(([cat, items]) => (
                  <div key={cat}>
                    <p className="titulo-seccion mb-2">{cat}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setD((x) => ({ ...x, productoId: p.id }))}
                          className={`cursor-pointer rounded-xl border-2 px-4 py-3 text-left transition ${
                            d.productoId === p.id ? "border-tinta bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          <div className="text-sm font-semibold">{p.nombre}</div>
                          <div className="text-xs text-zinc-500">{p.codigo} · {p.garantiaMeses} meses de garantía</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="etiqueta">Fecha de compra *</label>
                <input type="date" max={hoy()} value={d.fechaCompra} onChange={set("fechaCompra")} className="campo" />
              </div>
              <div>
                <label className="etiqueta">N° de serie</label>
                <input value={d.numeroSerie} onChange={set("numeroSerie")} placeholder="En la etiqueta del equipo" className="campo" />
              </div>
              <div>
                <label className="etiqueta">N° de factura</label>
                <input value={d.numeroFactura} onChange={set("numeroFactura")} placeholder="Ej: B-0004-00012345" className="campo" />
              </div>
            </div>
            {vigencia && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${vigencia.vigente ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
                {vigencia.vigente
                  ? `✓ Está dentro de la garantía. Vence el ${vigencia.vence}.`
                  : `⚠ La garantía venció el ${vigencia.vence}. Podés enviarla igual y Driven la va a evaluar.`}
              </div>
            )}
          </div>
        )}

        {paso === "falla" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(TIPOS_FALLA).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setD((x) => ({ ...x, tipoFalla: k }))}
                  className={`cursor-pointer rounded-xl border-2 px-3 py-3 text-sm font-medium transition ${
                    d.tipoFalla === k ? "border-tinta bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div>
              <label className="etiqueta">Contanos qué pasa *</label>
              <textarea
                rows={4}
                value={d.descripcionFalla}
                onChange={set("descripcionFalla")}
                placeholder="Ej: El motor gira pero no levanta presión. Empezó a fallar después de 2 meses de uso."
                className="campo"
              />
            </div>
          </div>
        )}

        {paso === "cliente" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="etiqueta">Nombre y apellido o razón social *</label>
              <input value={d.clienteNombre} onChange={set("clienteNombre")} className="campo" autoFocus />
            </div>
            <div>
              <label className="etiqueta">Teléfono</label>
              <input value={d.clienteTelefono} onChange={set("clienteTelefono")} className="campo" />
            </div>
            <div>
              <label className="etiqueta">DNI o CUIT</label>
              <input value={d.clienteDni} onChange={set("clienteDni")} className="campo" />
            </div>
            <div className="sm:col-span-2">
              <label className="etiqueta">Email</label>
              <input type="email" value={d.clienteEmail} onChange={set("clienteEmail")} className="campo" />
            </div>
          </div>
        )}

        {paso === "archivos" && (
          <div className="space-y-6">
            <ZonaArchivos
              titulo="Factura de compra *"
              ayuda="PDF o foto de la factura"
              accept="application/pdf,image/*"
              multiple={false}
              archivos={factura}
              onChange={setFactura}
            />
            <ZonaArchivos
              titulo="Fotos o video del producto"
              ayuda="Incluí una foto de la etiqueta con el número de serie"
              accept="image/*,video/mp4,video/quicktime"
              archivos={fotos}
              onChange={setFotos}
            />
          </div>
        )}

        {paso === "revisar" && (
          <div className="space-y-3">
            {[
              ...(sucursal ? [{ titulo: "Sucursal", valor: sucursal.nombre, paso: "sucursal" as Paso }] : []),
              {
                titulo: "Producto",
                valor: `${producto?.nombre} · comprado el ${d.fechaCompra.split("-").reverse().join("/")}${d.numeroSerie ? ` · S/N ${d.numeroSerie}` : ""}`,
                paso: "producto" as Paso,
              },
              { titulo: "Falla", valor: `${TIPOS_FALLA[d.tipoFalla as keyof typeof TIPOS_FALLA]}: ${d.descripcionFalla}`, paso: "falla" as Paso },
              { titulo: "Cliente", valor: [d.clienteNombre, d.clienteTelefono, d.clienteEmail].filter(Boolean).join(" · "), paso: "cliente" as Paso },
              { titulo: "Archivos", valor: `Factura + ${fotos.length} foto${fotos.length === 1 ? "" : "s"}/video${fotos.length === 1 ? "" : "s"}`, paso: "archivos" as Paso },
            ].map((r) => (
              <div key={r.titulo} className="flex items-start justify-between gap-4 rounded-xl bg-zinc-50 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-500">{r.titulo}</div>
                  <div className="text-sm">{r.valor}</div>
                </div>
                <button type="button" onClick={() => irA(r.paso)} className="cursor-pointer text-xs font-semibold text-marca-oscuro hover:underline">
                  Cambiar
                </button>
              </div>
            ))}
            {vigencia && !vigencia.vigente && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">⚠ Fuera de garantía: Driven la va a evaluar igual.</p>
            )}
          </div>
        )}

        {(error || estado?.error) && (
          <div className="mt-6">
            <Aviso estado={{ error: error ?? estado?.error }} />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-6">
          <button type="button" onClick={atras} disabled={indice === 0 || enviando} className="btn-secundario">
            ← Atrás
          </button>
          {paso === "revisar" ? (
            <button type="button" onClick={enviar} disabled={enviando} className="btn-marca px-8 py-3 text-base">
              {enviando ? "Enviando..." : "Enviar garantía a Driven ✓"}
            </button>
          ) : (
            <button type="button" onClick={siguiente} className="btn-primario px-8">
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
