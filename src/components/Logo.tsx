export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-marca text-lg font-black text-white">D</span>
      <div className="leading-tight">
        <div className={`text-base font-black tracking-wider ${claro ? "text-white" : "text-tinta"}`}>DRIVEN</div>
        <div className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${claro ? "text-zinc-400" : "text-zinc-500"}`}>
          Garantías
        </div>
      </div>
    </div>
  );
}
