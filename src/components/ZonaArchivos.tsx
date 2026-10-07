"use client";

import { useEffect, useMemo, useState } from "react";
import { MAX_ARCHIVO_MB } from "@/lib/constantes";
import { tamanoArchivo } from "@/lib/formato";

export function ZonaArchivos({
  titulo,
  ayuda,
  archivos,
  onChange,
  accept,
  multiple = true,
}: {
  titulo: string;
  ayuda: string;
  archivos: File[];
  onChange: (archivos: File[]) => void;
  accept: string;
  multiple?: boolean;
}) {
  const [arrastrando, setArrastrando] = useState(false);
  const previews = useMemo(() => archivos.map((a) => (a.type.startsWith("image/") ? URL.createObjectURL(a) : null)), [archivos]);
  useEffect(() => () => previews.forEach((p) => p && URL.revokeObjectURL(p)), [previews]);

  const agregar = (lista: FileList | null) => {
    if (!lista?.length) return;
    const nuevos = [...lista];
    onChange(multiple ? [...archivos, ...nuevos] : nuevos.slice(0, 1));
  };

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          agregar(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          arrastrando ? "border-marca bg-marca-claro" : "border-zinc-300 bg-zinc-50 hover:border-tinta hover:bg-white"
        }`}
      >
        <span className="text-3xl">📎</span>
        <span className="mt-2 font-semibold">{titulo}</span>
        <span className="mt-1 text-xs text-zinc-500">{ayuda}</span>
        <span className="mt-3 text-xs font-semibold text-marca-oscuro underline">Elegir archivo o arrastrarlo acá</span>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            agregar(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {archivos.length > 0 && (
        <ul className="mt-3 space-y-2">
          {archivos.map((a, i) => {
            const grande = a.size > MAX_ARCHIVO_MB * 1024 * 1024;
            return (
              <li key={`${a.name}-${i}`} className={`flex items-center gap-3 rounded-xl border p-2 ${grande ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white"}`}>
                {previews[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[i]!} alt="" className="h-11 w-11 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-zinc-100 text-[10px] font-bold text-zinc-500">
                    {a.type === "application/pdf" ? "PDF" : a.type.startsWith("video/") ? "VIDEO" : "ARCH"}
                  </span>
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <div className="truncate font-medium">{a.name}</div>
                  <div className={`text-xs ${grande ? "text-red-700" : "text-zinc-500"}`}>
                    {tamanoArchivo(a.size)}
                    {grande && ` · supera ${MAX_ARCHIVO_MB} MB`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(archivos.filter((_, j) => j !== i))}
                  className="cursor-pointer rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-red-600"
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
