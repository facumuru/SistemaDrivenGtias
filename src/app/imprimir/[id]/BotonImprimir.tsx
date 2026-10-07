"use client";

export function BotonImprimir() {
  return (
    <button onClick={() => window.print()} className="btn-primario">
      🖨 Imprimir
    </button>
  );
}
